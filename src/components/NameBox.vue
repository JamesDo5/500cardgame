<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex'
import { now } from '../game/clock.js';
import { AUTOPLAY_MARGIN_MS } from '../config.js';

const props = defineProps(['namepos']);
const store = useStore();

const namepos2playerindex = {
    nameboxLeftCards: 1,
    nameboxTopCards: 2,
    nameboxRightCards: 3,
    nameboxMe: 0,
};
const pos = namepos2playerindex[props.namepos] ?? 0;
const name = computed(() => store.state.playerNames[pos]);
const isDealer = computed(() => store.state.dealer === pos);
const isTurn = computed(() => store.state.turn.pos === pos);
const effectiveDeadline = computed(() => store.state.turn.deadlineMs - (pos === 0 ? AUTOPLAY_MARGIN_MS : 0));
const secondsLeft = computed(() => {
    if (!isTurn.value || !store.state.turn.deadlineMs) return null;
    return Math.max(0, Math.ceil((effectiveDeadline.value - now.value) / 1000));
});
const fraction = computed(() => {
    const { deadlineMs, startedMs } = store.state.turn;
    if (!isTurn.value || !deadlineMs) return 0;
    const total = Math.max(1, effectiveDeadline.value - startedMs);
    return Math.min(1, Math.max(0, (effectiveDeadline.value - now.value) / total));
});
const RING = 2 * Math.PI * 11;
const dashOffset = computed(() => RING * (1 - fraction.value));
const urgent = computed(() => secondsLeft.value !== null && secondsLeft.value <= 5);
</script>

<template>
    <div class="namecard-wrapper" :class="{ dealer: isDealer, turn: isTurn }" :id="namepos">
        <div class="namecard-bg"></div>
        <div class="namecard"></div>
        <div class="player-name">
            <span class="name-text">{{ name }}</span>
            <span v-if="isDealer" class="dealer-chip" title="Dealer">D</span>
            <span v-if="secondsLeft !== null" class="cat-clock" :class="{ urgent }">
                <svg viewBox="0 0 28 28" class="clock-ring">
                    <circle cx="14" cy="14" r="11" class="ring-bg" />
                    <circle cx="14" cy="14" r="11" class="ring-fg" :style="{ strokeDasharray: RING, strokeDashoffset: dashOffset }" />
                </svg>
                <span class="cat-face">🐱</span>
                <span class="clock-seconds">{{ secondsLeft }}</span>
            </span>
        </div>
    </div>
</template>

<style scoped>
.namecard-wrapper {
    position: absolute;
    display: inline-block;
    z-index: 5;
    transition: all 0.3s ease;
    transform: translate(-50%, -50%);
}
.namecard-wrapper:hover {
    transform: translate(-50%, -50%) scale(1.05);
}
#nameboxLeftCards {
    top: 440px;
    left: 200px;
}
#nameboxTopCards {
    top: 125px;
    left: 800px;
}
#nameboxRightCards {
    top: 440px;
    left: 1400px;
}
#nameboxMe {
    top: 32px;
    left: 1420px;
}
#nameboxMe .player-name::before {
    content: '👤';
}

.namecard-bg {
    position: absolute;
    background: linear-gradient(45deg, #3498db, #2ecc71);
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 0;
    opacity: 0.6;
    transition: opacity 0.3s ease;
    z-index: 0;
}
.namecard-wrapper:hover .namecard-bg {
    opacity: 0.8;
    z-index: 2;
}
.namecard-wrapper.dealer .namecard-bg {
    background: linear-gradient(90deg, #f1c40f, #f39c12, #f1c40f, #f39c12);
    background-size: 300% 100%;
    opacity: 0.95;
    animation: dealerShimmer 3s linear infinite;
}
.namecard-wrapper.turn .namecard-bg {
    background: linear-gradient(45deg, #f1c40f, #e67e22);
    opacity: 0.9;
}
.namecard-wrapper.dealer.turn .namecard-bg {
    background: linear-gradient(90deg, #f1c40f, #e74c3c, #f1c40f, #e74c3c);
    background-size: 300% 100%;
    animation: dealerShimmer 1.5s linear infinite;
}
@keyframes dealerShimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: 300% 50%; }
}

.namecard {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #2c3e50;
    border-radius: 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1;
}

.player-name {
    position: relative;
    padding: 12px 24px;
    color: #ecf0f1;
    letter-spacing: 1px;
    font-weight: 600;
    font-family: Arial, sans-serif;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
}
.dealer-chip {
    display: inline-block;
    padding: 0 7px;
    border-radius: 0;
    background-color: #f1c40f;
    color: #2c3e50;
    font-size: 12px;
    font-weight: 800;
}

.cat-clock {
    position: relative;
    width: 34px;
    height: 34px;
    display: inline-block;
    animation: catTick 1s ease-in-out infinite alternate;
}
.clock-ring {
    position: absolute;
    inset: 0;
    width: 34px;
    height: 34px;
    transform: rotate(-90deg);
}
.ring-bg {
    fill: #2c3e50;
    stroke: rgba(255, 255, 255, 0.25);
    stroke-width: 3;
}
.ring-fg {
    fill: none;
    stroke: #f1c40f;
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.25s linear, stroke 0.3s;
}
.cat-clock.urgent .ring-fg {
    stroke: #e74c3c;
}
.cat-face {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    line-height: 1;
}
.clock-seconds {
    position: absolute;
    bottom: -6px;
    right: -8px;
    background: #2c3e50;
    border-radius: 0;
    padding: 0 4px;
    font-size: 10px;
    line-height: 12px;
    color: #f1c40f;
}
.cat-clock.urgent .clock-seconds {
    color: #e74c3c;
}
@keyframes catTick {
    from { transform: rotate(-10deg); }
    to { transform: rotate(10deg); }
}

.portrait #nameboxLeftCards {
    top: 565px;
    left: 90px;
}
.portrait #nameboxTopCards {
    top: 240px;
    left: 400px;
}
.portrait #nameboxRightCards {
    top: 565px;
    left: auto;
    right: 90px;
    transform: translate(50%, -50%);
}
.portrait #nameboxMe {
    top: auto;
    bottom: 565px;
    left: 110px;
    transform: translate(-50%, 0);
}
.portrait .player-name {
    box-sizing: border-box;
    max-width: 170px;
    padding: 6px 10px;
    gap: 6px;
    font-size: 14px;
    letter-spacing: 0.5px;
    white-space: normal;
}
.portrait .name-text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    min-width: 0;
    line-height: 1.2;
    overflow-wrap: break-word;
}
.portrait .dealer-chip, .portrait .cat-clock {
    flex-shrink: 0;
}
</style>
