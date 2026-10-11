<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex'
import { mode } from '../config.js';
import { socket } from '../net/socket.js';
import { C2S } from '../net/messages.js';
import { now } from '../game/clock.js';
import { useRouter } from 'vue-router';

const store = useStore();
const visible = computed(() => store.state.gameState === 6 && store.state.gameWinner !== -1);
const weWon = computed(() => store.state.gameWinner === 0);
const scores = computed(() => store.state.scores);
const handScores = computed(() => store.state.handScores);
const names = computed(() => store.state.playerNames);
const COLORS = ['#f1c40f', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#ecf0f1'];
const confetti = Array.from({ length: 40 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    delay: `${(i % 10) * 0.25}s`,
    duration: `${2.4 + (i % 5) * 0.4}s`,
    color: COLORS[i % COLORS.length],
    rotate: `${(i * 53) % 360}deg`,
}));

const router = useRouter();
const rematchSeconds = computed(() => {
    const at = store.state.rematchAtMs;
    if (!at) return null;
    return Math.max(0, Math.ceil((at - now.value) / 1000));
});
const rematchRequested = ref(false);
function newGame() {
    store.getters.getGameTable().newGame();
}
function rematch() {
    rematchRequested.value = true;
    socket.send(C2S.REMATCH);
}
function leave() {
    socket.send(C2S.LEAVE);
    setTimeout(() => socket.close(), 150);
    router.push({ name: 'home' });
}
</script>

<template>
    <Transition name="winner">
        <div v-if="visible" class="winner-overlay">
            <div v-if="weWon" class="confetti-layer">
                <span v-for="(c, i) in confetti" :key="i" class="confetti" :style="{ left: c.left, animationDelay: c.delay, animationDuration: c.duration, backgroundColor: c.color, transform: `rotate(${c.rotate})` }"></span>
            </div>
            <div class="winner-card">
                <div class="winner-title">{{ weWon ? 'We win!' : 'They win' }}</div>
                <div class="winner-sub">{{ weWon ? `${names[0]} and ${names[2]} take it.` : `${names[1]} and ${names[3]} take it.` }}</div>
                <table class="winner-scores">
                    <thead>
                        <tr><th>Us</th><th>Them</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="(d, i) in handScores" :key="i"><td>{{ d[0] }}</td><td>{{ d[1] }}</td></tr>
                        <tr class="winner-total"><td>{{ scores[0] }}</td><td>{{ scores[1] }}</td></tr>
                    </tbody>
                </table>
                <button v-if="mode.standalone" class="winner-button" type="button" @click="newGame">New game</button>
                <template v-else>
                    <div v-if="rematchSeconds !== null" class="winner-wait">Rematch starts in {{ rematchSeconds }}s</div>
                    <div class="winner-actions">
                        <button class="ui-button danger" type="button" @click="leave">Leave table</button>
                        <button class="winner-button" type="button" :disabled="rematchRequested || rematchSeconds !== null" @click="rematch">{{ rematchSeconds !== null ? 'Rematch queued' : 'Rematch' }}</button>
                    </div>
                </template>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.winner-overlay {
    position: absolute;
    inset: 0;
    background: rgba(20, 30, 40, 0.82);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 60;
    overflow: hidden;
}
.winner-card {
    position: relative;
    background: #2c3e50;
    border-radius: 0;
    padding: 32px 48px;
    color: #ecf0f1;
    font-family: Arial, sans-serif;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    min-width: 360px;
    animation: winnerPop 0.6s cubic-bezier(.2,1.4,.4,1);
}
.winner-title {
    font-size: 48px;
    font-weight: 800;
    letter-spacing: 2px;
}
.winner-sub {
    margin-top: 6px;
    color: #bdc3c7;
}
.winner-scores {
    margin: 20px auto 0;
    border-collapse: collapse;
    font-size: 18px;
}
.winner-scores th, .winner-scores td {
    padding: 2px 24px;
}
.winner-scores th {
    text-decoration: underline;
    text-underline-offset: 3px;
}
.winner-scores td + td, .winner-scores th + th {
    border-left: 2px solid tomato;
}
.winner-total td {
    border-top: 1px dashed lightslategray;
    font-weight: bold;
}
.winner-button {
    margin-top: 24px;
    padding: 12px 36px;
    font-size: 20px;
    font-weight: bold;
    color: #2c3e50;
    background: linear-gradient(45deg, #f1c40f, #f39c12);
    border: none;
    border-radius: 0;
    cursor: pointer;
}
.winner-wait {
    margin-top: 24px;
    color: #f1c40f;
    font-weight: bold;
}
.winner-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 24px;
}
.winner-actions .winner-button { margin-top: 0; }
.winner-button:disabled { opacity: 0.5; cursor: default; }
.confetti-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.confetti {
    position: absolute;
    top: -20px;
    width: 10px;
    height: 16px;
    border-radius: 0;
    animation-name: confettiFall;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
}
@keyframes confettiFall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(1050px) rotate(720deg); opacity: 0.6; }
}
@keyframes winnerPop {
    from { transform: scale(0.6); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
.winner-enter-active, .winner-leave-active {
    transition: opacity 0.4s;
}
.winner-enter-from, .winner-leave-to {
    opacity: 0;
}
</style>
