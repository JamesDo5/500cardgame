<template>
    <button v-if="canSort" class="sort-button" type="button" @click="sortNow">Sort hand</button>
    <div class="card-row" id="bottomCards">
        <div v-for="n in 10" :key="n" class="card-back hand-card"><img draggable="false" :src="backUrl"></div>
    </div>
</template>

<script setup>
import { onMounted, computed, watch } from 'vue';
import { useStore } from 'vuex'
import { cardBackUrl, elem2CardStr, isValidCardStr, preloadCardImages, produceCardHtml } from '../game/cards.js';
import { sortHand } from '../game/rules.js';
import { saveHandOrder } from '../session.js';
import { activeTrump } from '../theme.js';
import { cardDrag } from '../drag.js';

const emit = defineEmits(['hand-rendered'])
const store = useStore()

const backUrl = computed(() => cardBackUrl(activeTrump(store.state)));
const canSort = computed(() => store.state.gameState >= 1 && store.state.gameState <= 5 && !store.state.firstCardPlayed && store.state.handCards.length > 1);

function sortNow() {
    replaceHand(sortHand(store.getters.getSharedHandCards(), store.state.trumpSuit));
}

function syncOrder() {
    const cardsElement = document.getElementById('bottomCards');
    if (!cardsElement) return;
    store.commit('setSharedHandCards', Array.from(cardsElement.children).map(elem2CardStr));
}

watch(() => store.state.handCards, (cards) => {
    const gameId = store.state.session.gameId;
    if (gameId && cards.length) saveHandOrder(gameId, cards);
});

function incomingHandCards(cards) {
    if (!Array.isArray(cards) || cards.length !== 10 || !cards.every(isValidCardStr)) {
        console.error("incomingHandCards() -- expected 10 valid cards, got:", cards);
        return 1;
    }
    preloadCardImages(cards);
    store.commit('setSharedHandCards', cards.slice());
    renderHand(cards);
    emit('hand-rendered');
    return 0;
}

function replaceHand(cards) {
    if (!Array.isArray(cards) || !cards.every(isValidCardStr)) {
        console.error("replaceHand() -- invalid cards:", cards);
        return 1;
    }
    preloadCardImages(cards);
    store.commit('setSharedHandCards', cards.slice());
    renderHand(cards);
    return 0;
}

function handifyCard(ele) {
    ele.classList.remove("real-card");
    ele.classList.add("hand-card");
}

function renderHand(cards) {
    const cardsElement = document.getElementById('bottomCards');
    if (!cardsElement) {
        console.error("renderHand() -- Bottom cards not found");
        return 1;
    }
    cardDrag.abort();
    cardsElement.innerHTML = cards.map(card => produceCardHtml(card, false, 'hand-card')).join('');
    return 0;
}

function markLegal(legalCards) {
    const cardsElement = document.getElementById('bottomCards');
    if (!cardsElement) return;
    for (const ele of cardsElement.children) {
        const illegal = legalCards !== null && !legalCards.includes(elem2CardStr(ele));
        ele.classList.toggle("illegal", illegal);
    }
}

defineExpose({ renderHand, incomingHandCards, handifyCard, markLegal, syncOrder })

onMounted(() => {
    store.commit('setSharedHand', { renderHand, incomingHandCards, replaceHand, markLegal, handifyCard, syncOrder });
});
</script>

<style scoped>
.card-row {
    position: absolute;
    display: flex;
    gap: 10px;
}

#bottomCards {
    bottom: 5px;
    left: 0;
    width: 1600px;
    z-index: 4;
    gap: 7px;
    perspective: 1000px;
    transform-style: preserve-3d;
    min-height: 257px;
    justify-content: center;
}
#bottomCards:has(> :nth-child(9)) :deep(.hand-card) {
    margin-right: -32px;
}
#bottomCards:has(> :nth-child(11)) :deep(.hand-card) {
    margin-right: -62px;
}
#bottomCards:has(> :nth-child(13)) :deep(.hand-card) {
    margin-right: -90px;
}
#bottomCards :deep(.hand-card:last-child) {
    margin-right: 0;
}

#bottomCards :deep(.hand-card) {
    position: relative;
    transition: transform 0.15s, opacity 0.2s, filter 0.2s;
}

#bottomCards :deep(.hand-card > *) {
    width: 180px;
    height: 257px;
    background-color: var(--ivory);
    border-radius: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    will-change: transform;
}

#bottomCards :deep(.spun) {
    transform: rotate(0.5turn);
}

.sort-button {
    position: absolute;
    bottom: 275px;
    right: 300px;
    padding: 8px 18px;
    font-size: 15px;
    font-weight: bold;
    color: var(--ink);
    background: var(--ivory);
    border: none;
    border-radius: 0;
    cursor: pointer;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
    z-index: 6;
}
.sort-button:hover {
    background: var(--gold);
}

#bottomCards :deep(.illegal) {
    opacity: 0.45;
    filter: grayscale(0.7);
}

.portrait #bottomCards {
    width: 800px;
    flex-wrap: wrap;
    gap: 6px 0;
    min-height: 0;
}
.portrait #bottomCards :deep(.hand-card), .portrait #bottomCards:has(> :nth-child(9)) :deep(.hand-card) {
    margin-right: -50px;
}
.portrait #bottomCards:has(> :nth-child(11)) :deep(.hand-card), .portrait #bottomCards:has(> :nth-child(13)) :deep(.hand-card) {
    margin-right: -50px;
}
.portrait #bottomCards :deep(.hand-card:last-child), .portrait #bottomCards :deep(.hand-card:nth-child(5n)) {
    margin-right: 0;
}
.portrait #bottomCards :deep(.hand-card > *) {
    width: 190px;
    height: 271px;
}
.portrait .sort-button {
    bottom: calc(565px - var(--hand-shift, 0px));
    right: 20px;
    transition: bottom 0.3s ease;
}
</style>
