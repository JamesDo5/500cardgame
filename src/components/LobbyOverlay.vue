<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex'
import { socket } from '../net/socket.js';
import { C2S, PACE } from '../net/messages.js';
import { gameLink } from '../session.js';
import { mode, WIKIPEDIA_URL, RELAXED_MULTIPLIER } from '../config.js';

const props = defineProps(['gameId']);
const emit = defineEmits(['leave', 'rules']);
const store = useStore();
const copied = ref(false);

const seats = computed(() => {
    const lobby = store.state.lobby;
    if (Array.isArray(lobby.seats) && lobby.seats.length === 4) return lobby.seats;
    return store.state.playerNames.map((name, pos) => ({ name, occupied: name !== 'Empty seat' && name !== '', connected: true, bot: false, host: pos === 0 && mode.standalone }));
});
const occupiedCount = computed(() => seats.value.filter(s => s.occupied).length);
const iAmHost = computed(() => !!seats.value[0]?.host);
const canStart = computed(() => iAmHost.value && occupiedCount.value === 4);
const LAYOUT = [
    { pos: 2, label: 'Partner', cls: 'seat-top' },
    { pos: 1, label: 'Left', cls: 'seat-left' },
    { pos: 3, label: 'Right', cls: 'seat-right' },
    { pos: 0, label: 'You', cls: 'seat-bottom' },
];
const connection = computed(() => store.state.connection);
const pace = computed(() => store.state.lobby.pace ?? store.state.pace);
const PACES = [
    { value: PACE.COMPETITIVE, label: 'Competitive', hint: 'Standard time per turn' },
    { value: PACE.RELAXED, label: 'Relaxed', hint: `${RELAXED_MULTIPLIER}x the time per turn` },
];

function seatClick(pos) {
    if (pos === 0 || mode.standalone) return;
    socket.send(C2S.CHANGE_SEAT, { seat: pos });
}
function start() {
    if (!canStart.value) return;
    socket.send(C2S.START_GAME);
}
function setPace(value) {
    if (value === pace.value) return;
    if (mode.standalone) { store.commit('setPace', value); return; }
    socket.send(C2S.SET_PACE, { pace: value });
}
async function share() {
    const link = gameLink(props.gameId);
    try {
        await navigator.clipboard.writeText(link);
        copied.value = true;
        setTimeout(() => { copied.value = false; }, 1800);
    } catch {
        window.prompt('Copy this link', link);
    }
}
</script>

<template>
    <div class="lobby-overlay">
        <div class="lobby">
            <div class="lobby-top">
                <div>
                    <div class="lobby-kicker">Game <span class="pace-tag">{{ pace }} pace</span></div>
                    <div class="lobby-id">{{ gameId }}</div>
                </div>
                <div class="lobby-actions">
                    <button class="ui-button" type="button" @click="share">{{ copied ? 'Link copied' : 'Share link' }}</button>
                    <button class="ui-button" type="button" @click="emit('rules')">Rules</button>
                    <a class="ui-button" :href="WIKIPEDIA_URL" target="_blank" rel="noopener">Wikipedia</a>
                </div>
            </div>

            <div class="seat-grid">
                <div v-for="s in LAYOUT" :key="s.pos" class="seat" :class="[s.cls, { empty: !seats[s.pos]?.occupied, me: s.pos === 0, swappable: s.pos !== 0 && !mode.standalone, team0: s.pos % 2 === 0, team1: s.pos % 2 === 1 }]" @click="seatClick(s.pos)">
                    <div class="seat-label">{{ s.label }}</div>
                    <div class="seat-name">{{ seats[s.pos]?.occupied ? seats[s.pos].name : 'Empty seat' }}</div>
                    <div class="seat-flags">
                        <span v-if="seats[s.pos]?.host" class="flag host">Host</span>
                        <span v-if="seats[s.pos]?.bot" class="flag">Bot</span>
                        <span v-if="seats[s.pos]?.occupied && seats[s.pos]?.connected === false" class="flag away">Away</span>
                        <span v-if="!seats[s.pos]?.occupied && s.pos !== 0" class="flag hint">Click to move here</span>
                        <span v-else-if="s.pos !== 0 && seats[s.pos]?.occupied && !mode.standalone" class="flag hint">Click to swap</span>
                    </div>
                </div>
                <div class="teams-note">
                    <span class="team0">You and {{ seats[2]?.occupied ? seats[2].name : 'your partner' }}</span>
                    <span class="vs">vs</span>
                    <span class="team1">{{ seats[1]?.occupied ? seats[1].name : 'left' }} and {{ seats[3]?.occupied ? seats[3].name : 'right' }}</span>
                </div>
            </div>

            <div class="pace-row">
                <div class="pace-label">Pace</div>
                <div class="pace-toggle">
                    <button v-for="p in PACES" :key="p.value" class="pace-option" :class="{ active: pace === p.value }" type="button" :aria-pressed="pace === p.value" @click="setPace(p.value)">
                        <span class="pace-name">{{ p.label }}</span>
                        <span class="pace-hint">{{ p.hint }}</span>
                    </button>
                </div>
            </div>

            <div class="lobby-bottom">
                <div class="lobby-status">
                    <template v-if="connection === 'connecting' || connection === 'closed'">Connecting to the table…</template>
                    <template v-else-if="occupiedCount < 4">Waiting for {{ 4 - occupiedCount }} more player{{ 4 - occupiedCount === 1 ? '' : 's' }}. Share the link.</template>
                    <template v-else-if="iAmHost">Everyone is here. Start when ready.</template>
                    <template v-else>Everyone is here. Waiting for {{ seats.find(x => x.host)?.name ?? 'the host' }} to start.</template>
                </div>
                <div class="lobby-actions">
                    <button class="ui-button danger" type="button" @click="emit('leave')">Leave</button>
                    <button class="ui-button primary" type="button" :disabled="!canStart" @click="start">Start game</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.lobby-overlay {
    position: absolute;
    inset: 0;
    background: rgba(20, 30, 40, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 70;
    font-family: Arial, sans-serif;
    color: #ecf0f1;
}
.lobby {
    width: 900px;
    background: #2c3e50;
    border: 3px solid #ecf0f1;
    padding: 28px 36px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}
.lobby-top, .lobby-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}
.lobby-kicker {
    font-size: 13px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #bdc3c7;
}
.lobby-id {
    font-size: 56px;
    font-weight: 800;
    letter-spacing: 10px;
    line-height: 1;
}
.lobby-actions {
    display: flex;
    gap: 10px;
}
.seat-grid {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto auto;
    gap: 12px;
    margin: 28px 0;
}
.seat {
    border: 2px solid #95a5a6;
    padding: 14px 18px;
    background: #34495e;
    min-height: 92px;
}
.seat.team0 { border-color: #2ecc71; }
.seat.team1 { border-color: #e67e22; }
.seat.empty { border-style: dashed; background: rgba(52, 73, 94, 0.5); }
.seat.swappable { cursor: pointer; }
.seat.swappable:hover { background: #3d566e; }
.seat.me { outline: 3px solid #f1c40f; outline-offset: -3px; }
.seat-top { grid-column: 2; grid-row: 1; }
.seat-left { grid-column: 1; grid-row: 2; }
.seat-right { grid-column: 3; grid-row: 2; }
.seat-bottom { grid-column: 2; grid-row: 3; }
.teams-note {
    grid-column: 2;
    grid-row: 2;
    align-self: center;
    text-align: center;
    font-size: 15px;
    line-height: 1.6;
}
.teams-note .vs { display: block; color: #bdc3c7; letter-spacing: 2px; }
.team0 { color: #2ecc71; }
.team1 { color: #e67e22; }
.seat-label {
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #bdc3c7;
}
.seat-name {
    font-size: 24px;
    font-weight: 700;
    margin: 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.seat.empty .seat-name { color: #95a5a6; font-weight: normal; }
.seat-flags { display: flex; gap: 8px; min-height: 18px; }
.flag {
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 1px 6px;
    border: 1px solid #bdc3c7;
    color: #bdc3c7;
}
.flag.host { border-color: #f1c40f; color: #f1c40f; }
.flag.away { border-color: #e74c3c; color: #e74c3c; }
.flag.hint { border: none; padding: 0; text-transform: none; letter-spacing: 0; color: #7f8c8d; }
.lobby-status { font-size: 16px; color: #bdc3c7; }
.pace-tag {
    margin-left: 10px;
    padding: 1px 6px;
    border: 1px solid #7f8c8d;
    color: #95a5a6;
    letter-spacing: 1px;
}
.pace-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
}
.pace-label {
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #bdc3c7;
}
.pace-toggle { display: flex; }
.pace-option {
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px 14px;
    background: #34495e;
    border: 2px solid #95a5a6;
    color: #bdc3c7;
    cursor: pointer;
    text-align: left;
}
.pace-option + .pace-option { border-left: none; }
.pace-option:hover { background: #3d566e; }
.pace-option.active {
    background: #ecf0f1;
    border-color: #ecf0f1;
    color: #2c3e50;
}
.pace-name { font-size: 15px; font-weight: 700; }
.pace-hint { font-size: 11px; }
.pace-option.active .pace-hint { color: #34495e; }

.portrait .lobby {
    width: 720px;
}
</style>
