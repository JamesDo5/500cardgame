<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex'
import { now } from '../game/clock.js';
import { BIG_COUNTDOWN_SECONDS } from '../config.js';

const store = useStore();
const secondsLeft = computed(() => {
    const { pos, deadlineMs } = store.state.turn;
    if (pos !== 0 || !deadlineMs || store.state.gameState !== 3) return null;
    return Math.max(0, Math.ceil((deadlineMs - now.value) / 1000));
});
const visible = computed(() => secondsLeft.value !== null && secondsLeft.value > 0 && secondsLeft.value <= BIG_COUNTDOWN_SECONDS);
const fontSize = computed(() => `${90 + (BIG_COUNTDOWN_SECONDS - secondsLeft.value) * 28}px`);
</script>

<template>
    <div v-if="visible" class="big-countdown" :key="secondsLeft" :style="{ fontSize }">{{ secondsLeft }}</div>
</template>

<style scoped>
.big-countdown {
    position: absolute;
    top: 38%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #e74c3c;
    font-family: Impact, 'Arial Black', sans-serif;
    font-weight: 900;
    text-shadow: 0 0 24px rgba(231, 76, 60, 0.7), 0 6px 0 #7b241c;
    z-index: 40;
    pointer-events: none;
    animation: countPop 0.9s cubic-bezier(.2,1.6,.4,1);
}
@keyframes countPop {
    0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
    40% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
}
</style>
