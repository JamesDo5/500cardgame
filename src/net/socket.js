import { C2S, S2C } from './messages.js';

const BACKOFF_BASE_MS = 500;
const BACKOFF_MAX_MS = 15000;
const HEARTBEAT_MS = 20000;

export class GameSocket {
    constructor() {
        this.url = '';
        this.ws = null;
        this.handlers = new Map();
        this.queue = [];
        this.seq = 0;
        this.lastSeqIn = -1;
        this.attempt = 0;
        this.closedByUser = false;
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.onStatus = () => {};
        this.joinPayload = null;
    }

    setJoin(payload) {
        this.joinPayload = payload;
    }

    connect(url) {
        this.url = url;
        this.closedByUser = false;
        this.open();
    }

    open() {
        this.onStatus('connecting');
        try {
            this.ws = new WebSocket(this.url);
        } catch (err) {
            console.error('GameSocket -- failed to construct WebSocket:', err);
            this.scheduleReconnect();
            return;
        }
        this.ws.onopen = () => {
            this.attempt = 0;
            if (this.joinPayload) this.ws.send(JSON.stringify({ type: C2S.JOIN, payload: this.joinPayload, seq: this.seq++ }));
            this.onStatus('open');
            this.flush();
            this.startHeartbeat();
        };
        this.ws.onmessage = (evt) => this.receive(evt.data);
        this.ws.onerror = () => { };
        this.ws.onclose = () => {
            this.stopHeartbeat();
            this.onStatus('closed');
            if (!this.closedByUser) this.scheduleReconnect();
        };
    }

    scheduleReconnect() {
        const delay = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** this.attempt) * (0.75 + Math.random() / 2);
        this.attempt += 1;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.open(), delay);
    }

    close() {
        this.closedByUser = true;
        clearTimeout(this.reconnectTimer);
        this.stopHeartbeat();
        this.ws?.close();
        this.ws = null;
        this.queue = [];
        this.joinPayload = null;
        this.seq = 0;
        this.lastSeqIn = -1;
        this.attempt = 0;
    }

    on(type, handler) {
        this.handlers.set(type, handler);
        return this;
    }

    send(type, payload = {}) {
        const frame = JSON.stringify({ type, payload, seq: this.seq++ });
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(frame);
        } else {
            this.queue.push(frame);
        }
    }

    flush() {
        while (this.queue.length && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(this.queue.shift());
        }
    }

    receive(raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            console.error('GameSocket -- non-JSON frame:', raw);
            return;
        }
        if (Number.isInteger(msg.seq)) {
            if (this.lastSeqIn !== -1 && msg.seq !== this.lastSeqIn + 1) {
                console.warn('GameSocket -- seq gap, requesting sync. expected', this.lastSeqIn + 1, 'got', msg.seq);
                this.send(C2S.REQUEST_SYNC);
            }
            this.lastSeqIn = msg.seq;
        }
        if (msg.type === S2C.PONG) return;
        const handler = this.handlers.get(msg.type);
        if (!handler) {
            console.warn('GameSocket -- no handler for', msg.type, msg.payload);
            return;
        }
        try {
            handler(msg.payload ?? {});
        } catch (err) {
            console.error('GameSocket -- handler threw for', msg.type, err);
        }
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => this.send(C2S.PING), HEARTBEAT_MS);
    }

    stopHeartbeat() {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
    }
}

export const socket = new GameSocket();
