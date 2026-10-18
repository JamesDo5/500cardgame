<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex'
import { socket } from '../net/socket.js';
import { C2S, PACE } from '../net/messages.js';
import { gameLink } from '../session.js';
import { THEME_OPTIONS, CARD_ART_OPTIONS, chooseThemeLevel, chooseCardArt } from '../settings.js';
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
    { value: PACE.COMPETITIVE, label: 'Competitive', hint: 'Normal timers' },
    { value: PACE.RELAXED, label: 'Relaxed', hint: `Timers ${RELAXED_MULTIPLIER}x longer` },
];
const themeLevel = computed(() => store.state.themeLevel);
const cardArt = computed(() => store.state.cardArt);

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

            <div class="option-rows">
                <div class="pace-row">
                    <div class="pace-label">Pace</div>
                    <div class="pace-toggle">
                        <button v-for="p in PACES" :key="p.value" class="pace-option" :class="{ active: pace === p.value }" type="button" :aria-pressed="pace === p.value" @click="setPace(p.value)">
                            <span class="pace-name">{{ p.label }}</span>
                            <span class="pace-hint">{{ p.hint }}</span>
                        </button>
                    </div>
                </div>
                <div class="pace-row theme-row">
                    <div class="pace-label">Trump theme</div>
                    <div class="pace-toggle">
                        <button v-for="t in THEME_OPTIONS" :key="t.value" class="pace-option theme-option" :class="{ active: themeLevel === t.value }" type="button" :aria-pressed="themeLevel === t.value" @click="chooseThemeLevel(store, t.value)">
                            <span class="pace-name">{{ t.label }}</span>
                            <span class="pace-hint">{{ t.hint }}</span>
                        </button>
                    </div>
                </div>
                <div class="pace-row art-row">
                    <div class="pace-label">Card art</div>
                    <div class="pace-toggle">
                        <button v-for="a in CARD_ART_OPTIONS" :key="a.value" class="pace-option art-option" :class="{ active: cardArt === a.value }" type="button" :aria-pressed="cardArt === a.value" @click="chooseCardArt(store, a.value)">
                            <span class="pace-name">{{ a.label }}</span>
                            <span class="pace-hint">{{ a.hint }}</span>
                        </button>
                    </div>
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
    background: rgba(8, 24, 14, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 70;
    font-family: Arial, sans-serif;
    color: var(--on-felt);
}
.lobby {
    width: 1240px;
    font-size: 22px;
    background: var(--felt);
    border: 3px solid var(--ivory);
    outline: 3px solid var(--gold-deep);
    padding: 1.75em 2.25em;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
    box-sizing: border-box;
}
.lobby .ui-button {
    font-size: 1em;
    padding: 0.625em 1.375em;
    border-color: var(--ink);
}
.lobby .ui-button.danger {
    color: var(--card-red);
    border-color: var(--card-red);
}
.lobby .ui-button.danger:hover {
    color: var(--ivory);
}
.lobby-top, .lobby-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1em;
}
.lobby-kicker {
    font-size: 0.8125em;
    letter-spacing: 0.23em;
    text-transform: uppercase;
    color: var(--on-felt-soft);
}
.lobby-id {
    font-size: 3.5em;
    font-weight: 800;
    letter-spacing: 0.18em;
    line-height: 1;
}
.lobby-actions {
    display: flex;
    gap: 0.625em;
}
.seat-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: auto auto auto;
    gap: 0.75em;
    margin: 1.75em 0;
}
.seat {
    border: 2px solid var(--on-felt-soft);
    padding: 0.875em 1.125em;
    background: var(--felt-deep);
    min-height: 5.75em;
    min-width: 0;
    box-sizing: border-box;
}
.seat.team0 { border-color: var(--gold-deep); }
.seat.team1 { border-color: var(--card-red); }
.seat.empty { border-style: dashed; background: rgba(0, 0, 0, 0.08); }
.seat.swappable { cursor: pointer; }
.seat.swappable:hover { background: var(--felt-edge); color: var(--ivory); }
.seat.swappable:hover .seat-label, .seat.swappable:hover .flag { color: var(--ivory-2); border-color: var(--ivory-2); }
.seat.me { outline: 3px solid var(--ivory); outline-offset: -3px; }
.seat-top { grid-column: 2; grid-row: 1; }
.seat-left { grid-column: 1; grid-row: 2; }
.seat-right { grid-column: 3; grid-row: 2; }
.seat-bottom { grid-column: 2; grid-row: 3; }
.teams-note {
    grid-column: 2;
    grid-row: 2;
    align-self: center;
    text-align: center;
    font-size: 0.9375em;
    line-height: 1.6;
}
.teams-note .vs { display: block; color: var(--on-felt-soft); letter-spacing: 0.13em; }
.team0 { color: var(--gold-ink); }
.team1 { color: var(--card-red); }
.seat-label {
    font-size: 0.75em;
    letter-spacing: 0.17em;
    text-transform: uppercase;
    color: var(--on-felt-soft);
}
.seat-name {
    font-size: 1.5em;
    font-weight: 700;
    margin: 0.17em 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.seat.empty .seat-name { color: var(--on-felt-soft); font-weight: normal; }
.seat-flags { display: flex; gap: 0.5em; min-height: 1.125em; }
.flag {
    font-size: 0.6875em;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    padding: 1px 0.55em;
    border: 1px solid var(--on-felt-soft);
    color: var(--on-felt-soft);
}
.flag.host { border-color: var(--gold-ink); color: var(--gold-ink); }
.flag.away { border-color: var(--card-red); color: var(--card-red); }
.flag.hint { border: none; padding: 0; text-transform: none; letter-spacing: 0; color: var(--on-felt-soft); }
.lobby-status { font-size: 1em; color: var(--on-felt); }
.pace-tag {
    margin-left: 0.625em;
    padding: 1px 0.375em;
    border: 1px solid var(--on-felt-soft);
    color: var(--on-felt-soft);
    letter-spacing: 0.08em;
}
.option-rows {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1em 2.5em;
    margin-bottom: 1.25em;
}
.pace-row {
    display: flex;
    align-items: center;
    gap: 1em;
}
.pace-label {
    font-size: 0.75em;
    letter-spacing: 0.17em;
    text-transform: uppercase;
    color: var(--on-felt-soft);
}
.pace-toggle { display: flex; }
.pace-option {
    font-family: inherit;
    font-size: 1em;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 0.5em 0.875em;
    background: var(--felt-deep);
    border: 2px solid var(--on-felt-soft);
    color: var(--on-felt);
    cursor: pointer;
    text-align: left;
}
.pace-option + .pace-option { border-left: none; }
.pace-option:hover { background: var(--felt-edge); color: var(--ivory); }
.pace-option.active {
    background: var(--ivory);
    border-color: var(--ivory);
    color: var(--ink);
}
.pace-name { font-size: 0.9375em; font-weight: 700; }
.pace-hint { font-size: 0.6875em; }
.pace-option.active .pace-hint { color: var(--ink-soft); }

.portrait .lobby-overlay {
    overflow-y: auto;
    touch-action: pan-y;
}
.portrait .lobby {
    width: 780px;
    font-size: 16px;
    padding: 1.5em 1.75em;
}
.portrait .lobby .ui-button {
    font-size: 0.875em;
    padding: 0.5em 0.9em;
}
</style>
