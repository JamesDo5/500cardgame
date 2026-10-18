import Vuex from 'vuex'
import { DEFAULT_PACE } from './config.js';
import { loadThemeLevel } from './session.js';

const FEED_MAX = 30;

export default new Vuex.Store({
    state: {
        gameTable: null,
        bidBox: null,
        hand: null,
        gameState: -1,
        handCards: [],
        winningBid: -1,
        dealer: 0,
        trumpSuit: '',
        playerNames: ['Me', 'Left', 'Top', 'Right'],
        scores: [0, 0],
        handScores: [],
        handScored: false,
        turn: { pos: -1, deadlineMs: 0, startedMs: 0 },
        cardCounts: [10, 10, 10, 10],
        trickCards: ['', '', '', ''],
        trickLeader: -1,
        jokerSuit: '',
        firstCardPlayed: false,
        gameWinner: -1,
        connection: 'idle',
        session: { gameId: '', seat: -1, token: '', name: '' },
        lobby: { seats: [], hostPos: -1, canStart: false },
        pace: DEFAULT_PACE,
        themeLevel: loadThemeLevel(),
        joinError: '',
        rematchAtMs: 0,
        autoBots: true,
        timersEnabled: true,
        stagedCards: [],
        blindFaceDown: false,
        notice: '',
        feed: [],
    },
    mutations: {
        setSharedGameTable(state, obj) { state.gameTable = obj; },
        setSharedBidBox(state, obj) { state.bidBox = obj; },
        setSharedHand(state, obj) { state.hand = obj; },
        setGameState(state, n) { state.gameState = n; },
        setSharedHandCards(state, arr) { state.handCards = arr; },
        setWinningBid(state, n) { state.winningBid = n; },
        setDealer(state, n) { state.dealer = n; },
        advanceDealer(state) { state.dealer = (state.dealer + 1) % 4; },
        setTrumpSuit(state, s) { state.trumpSuit = s; },
        setPlayerName(state, { pos, name }) { state.playerNames[pos] = name; },
        addHandScore(state, deltas) {
            if (state.handScored) return;
            state.handScores.push(deltas.slice());
            state.scores = [state.scores[0] + deltas[0], state.scores[1] + deltas[1]];
            state.handScored = true;
        },
        setScores(state, { scores, handScores }) {
            state.scores = scores.slice();
            state.handScores = handScores.map(d => d.slice());
            state.handScored = false;
        },
        setHandScored(state, b) { state.handScored = b; },
        reconcileHandScore(state, { deltas, scores }) {
            if (!Array.isArray(scores) || scores.length !== 2) return;
            const serverDeltas = Array.isArray(deltas) && deltas.length === 2 ? deltas.slice() : null;
            if (!state.handScored) {
                state.handScores.push(serverDeltas ?? [scores[0] - state.scores[0], scores[1] - state.scores[1]]);
                state.scores = scores.slice();
                state.handScored = true;
                return;
            }
            if (scores[0] === state.scores[0] && scores[1] === state.scores[1]) return;
            console.warn('reconcileHandScore -- server', scores, 'disagrees with client', state.scores, '. Believing server.');
            const last = state.handScores.length - 1;
            if (last >= 0) {
                const prev = state.handScores[last];
                state.handScores[last] = serverDeltas ?? [prev[0] + scores[0] - state.scores[0], prev[1] + scores[1] - state.scores[1]];
            }
            state.scores = scores.slice();
        },
        resetGame(state) {
            state.scores = [0, 0];
            state.handScores = [];
            state.handScored = false;
            state.winningBid = -1;
            state.trumpSuit = '';
            state.turn = { pos: -1, deadlineMs: 0, startedMs: 0 };
            state.gameWinner = -1;
            state.rematchAtMs = 0;
            state.handCards = [];
            state.trickCards = ['', '', '', ''];
            state.trickLeader = -1;
            state.jokerSuit = '';
            state.feed = [];
        },
        setTurn(state, turn) { state.turn = { startedMs: Date.now(), ...turn }; },
        setCardCount(state, { pos, n }) { state.cardCounts[pos] = Math.max(0, n); },
        resetCardCounts(state) { state.cardCounts = [10, 10, 10, 10]; },
        setTrickCards(state, arr) { state.trickCards = arr.slice(); },
        setTrickLeader(state, pos) { state.trickLeader = pos; },
        setJokerSuit(state, s) { state.jokerSuit = s; },
        setFirstCardPlayed(state, b) { state.firstCardPlayed = b; },
        setGameWinner(state, t) { state.gameWinner = t; },
        setConnection(state, s) { state.connection = s; },
        setSession(state, patch) { state.session = { ...state.session, ...patch }; },
        setLobby(state, lobby) { state.lobby = lobby; },
        setPace(state, pace) { state.pace = pace; },
        setThemeLevel(state, level) { state.themeLevel = level; },
        setJoinError(state, msg) { state.joinError = msg; },
        setRematchAt(state, ms) { state.rematchAtMs = ms; },
        setAutoBots(state, b) { state.autoBots = b; },
        setTimersEnabled(state, b) { state.timersEnabled = b; },
        setStagedCards(state, arr) { state.stagedCards = arr.slice(); },
        setBlindFaceDown(state, b) { state.blindFaceDown = b; },
        notify(state, msg) { state.notice = msg; },
        clearNotice(state) { state.notice = ''; },
        feedPush(state, msg) {
            state.feed.push(msg);
            if (state.feed.length > FEED_MAX) state.feed.shift();
        },
    },
    getters: {
        getGameTable: (state) => () => state.gameTable,
        getBidBox: (state) => () => state.bidBox,
        getHand: (state) => () => state.hand,
        getGameState: (state) => () => state.gameState,
        getSharedHandCards: (state) => () => state.handCards,
        getWinningBid: (state) => () => state.winningBid,
        getDealer: (state) => () => state.dealer,
        getTrumpSuit: (state) => () => state.trumpSuit,
        getPlayerNames: (state) => state.playerNames,
        getScores: (state) => state.scores,
    }
});
