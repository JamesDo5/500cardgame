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
    --plate-shift: translate(-50%, -50%);
    position: absolute;
    display: inline-block;
    z-index: 5;
    transition: all 0.3s ease;
    transform: var(--plate-shift);
}
.namecard-wrapper:hover {
    transform: var(--plate-shift) scale(1.05);
}
#nameboxLeftCards {
    top: 440px;
    left: 206px;
}
#nameboxTopCards {
    top: 125px;
    left: 800px;
}
#nameboxRightCards {
    top: 440px;
    left: 1394px;
}
#nameboxMe {
    --plate-shift: translateY(-50%);
    top: 32px;
    right: 20px;
}
#nameboxMe .namecard-bg, #nameboxMe .namecard {
    display: none;
}
#nameboxMe .player-name {
    padding: 6px 0;
    gap: 12px;
    color: var(--ivory);
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}
#nameboxMe .name-text {
    max-width: 250px;
}
#nameboxMe .player-name::before {
    content: var(--me-glyph);
    color: var(--trump-on-felt, var(--ivory));
    font-size: 26px;
    line-height: 1;
}
:root[data-trump="n"][data-theme-level="full"] #nameboxMe .player-name::before {
    font-size: 14px;
    font-weight: 800;
    padding: 2px 5px;
    border: 2px solid var(--trump-on-felt);
    color: var(--trump-on-felt);
}

.namecard-bg {
    position: absolute;
    background: linear-gradient(45deg, var(--ivory-3), var(--ink-soft));
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
.namecard-wrapper.turn .namecard-bg {
    background: linear-gradient(45deg, var(--gold-bright), var(--gold));
    opacity: 1;
    box-shadow: 0 0 14px 3px rgba(241, 209, 106, 0.7);
    animation: turnPulse 1.4s ease-in-out infinite;
}
#nameboxMe.turn .player-name {
    color: var(--gold-bright);
    text-shadow: 0 0 14px rgba(241, 209, 106, 0.9), 0 2px 6px rgba(0, 0, 0, 0.6);
    animation: turnTextPulse 1.4s ease-in-out infinite;
}
@keyframes turnPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(241, 209, 106, 0.85), 0 0 10px 2px rgba(241, 209, 106, 0.5); }
    50% { box-shadow: 0 0 0 8px rgba(241, 209, 106, 0), 0 0 24px 6px rgba(241, 209, 106, 0.8); }
}
@keyframes turnTextPulse {
    0%, 100% { text-shadow: 0 0 6px rgba(241, 209, 106, 0.5), 0 2px 6px rgba(0, 0, 0, 0.6); }
    50% { text-shadow: 0 0 18px rgba(241, 209, 106, 1), 0 0 32px rgba(241, 209, 106, 0.6), 0 2px 6px rgba(0, 0, 0, 0.6); }
}
@media (prefers-reduced-motion: reduce) {
    .namecard-wrapper.turn .namecard-bg, #nameboxMe.turn .player-name {
        animation: none;
    }
}

.namecard {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--ivory);
    border-radius: 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1;
}

.player-name {
    position: relative;
    padding: 14px 24px;
    color: var(--ink);
    font-size: 22px;
    letter-spacing: 1px;
    font-weight: 600;
    font-family: Arial, sans-serif;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
}
.name-text {
    max-width: 270px;
    overflow: hidden;
    text-overflow: ellipsis;
}
.dealer-chip {
    display: inline-block;
    padding: 1px 9px;
    border-radius: 0;
    background-color: var(--card-red);
    color: var(--ivory);
    font-size: 16px;
    font-weight: 800;
}

.cat-clock {
    position: relative;
    width: 44px;
    height: 44px;
    display: inline-block;
    animation: catTick 1s ease-in-out infinite alternate;
}
.clock-ring {
    position: absolute;
    inset: 0;
    width: 44px;
    height: 44px;
    transform: rotate(-90deg);
}
.ring-bg {
    fill: var(--ivory-2);
    stroke: rgba(0, 0, 0, 0.2);
    stroke-width: 3;
}
.ring-fg {
    fill: none;
    stroke: var(--gold-deep);
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.25s linear, stroke 0.3s;
}
.cat-clock.urgent .ring-fg {
    stroke: var(--card-red);
}
.cat-face {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    line-height: 1;
}
.clock-seconds {
    position: absolute;
    bottom: -7px;
    right: -9px;
    background: var(--ink);
    border-radius: 0;
    padding: 0 5px;
    font-size: 13px;
    line-height: 16px;
    color: var(--gold-bright);
}
.cat-clock.urgent .clock-seconds {
    color: var(--card-red-bright);
}
@keyframes catTick {
    from { transform: rotate(-10deg); }
    to { transform: rotate(10deg); }
}

.portrait #nameboxLeftCards {
    top: 565px;
    left: 118px;
}
.portrait #nameboxTopCards {
    top: 248px;
    left: 400px;
}
.portrait #nameboxRightCards {
    --plate-shift: translate(50%, -50%);
    top: 565px;
    left: auto;
    right: 118px;
}
.portrait #nameboxMe {
    --plate-shift: none;
    top: auto;
    right: auto;
    bottom: 565px;
    left: 20px;
}
.portrait #nameboxMe:hover {
    transform: scale(1.05);
}
.portrait .player-name {
    box-sizing: border-box;
    max-width: 220px;
    padding: 8px 12px;
    gap: 8px;
    font-size: 18px;
    letter-spacing: 0.5px;
    white-space: normal;
}
.portrait #nameboxMe .player-name {
    max-width: 210px;
    padding: 4px 0;
    font-size: 20px;
    white-space: nowrap;
}
.portrait .name-text {
    max-width: none;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    min-width: 0;
    line-height: 1.2;
    overflow-wrap: break-word;
}
.portrait #nameboxMe .name-text {
    display: block;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.portrait .dealer-chip, .portrait .cat-clock {
    flex-shrink: 0;
}
</style>
