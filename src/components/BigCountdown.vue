<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex'
import { now } from '../game/clock.js';
import { BIG_COUNTDOWN_SECONDS, AUTOPLAY_MARGIN_MS } from '../config.js';

const store = useStore();
const MY_ACTION_STATES = new Set([0, 1, 3, 5]);
const secondsLeft = computed(() => {
    const { pos, deadlineMs } = store.state.turn;
    if (pos !== 0 || !deadlineMs || !MY_ACTION_STATES.has(store.state.gameState)) return null;
    return Math.max(0, Math.ceil((deadlineMs - AUTOPLAY_MARGIN_MS - now.value) / 1000));
});
const visible = computed(() => secondsLeft.value !== null && secondsLeft.value > 0 && secondsLeft.value <= BIG_COUNTDOWN_SECONDS);
const fontSize = computed(() => `${70 + (BIG_COUNTDOWN_SECONDS - secondsLeft.value) * 20}px`);
</script>

<template>
    <div v-if="visible" class="big-countdown" :key="secondsLeft" :style="{ fontSize }">{{ secondsLeft }}</div>
</template>

<style scoped>
.big-countdown {
    position: absolute;
    top: 70px;
    right: 420px;
    transform-origin: top right;
    color: #e74c3c;
    font-family: Impact, 'Arial Black', sans-serif;
    font-weight: 900;
    line-height: 1;
    text-shadow: 0 0 24px rgba(231, 76, 60, 0.7), 0 6px 0 #7b241c;
    z-index: 40;
    pointer-events: none;
    animation: countPop 0.9s cubic-bezier(.2,1.6,.4,1);
}
@keyframes countPop {
    0% { transform: scale(0.3); opacity: 0; }
    40% { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); opacity: 0.9; }
}
</style>
