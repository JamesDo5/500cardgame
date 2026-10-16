<template>
    <button v-if="canSort" class="sort-button" type="button" @click="sortNow">Sort hand</button>
    <div class="card-row" id="bottomCards">
        <div v-for="n in 10" :key="n" class="card-back hand-card"><img draggable="false" :src="CARD_BACK_URL"></div>
    </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useStore } from 'vuex'
import Sortable from 'sortablejs';
import { CARD_BACK_URL, elem2CardStr, isValidCardStr, produceCardHtml } from '../game/cards.js';
import { sortHand } from '../game/rules.js';

const emit = defineEmits(['hand-rendered'])
const store = useStore()

let sortableHandCards;
const dragEndHandlers = [];
function onDragEnd(fn) {
    dragEndHandlers.push(fn);
}
const canSort = computed(() => store.state.gameState >= 1 && store.state.gameState <= 5 && !store.state.firstCardPlayed && store.state.handCards.length > 1);

function sortNow() {
    replaceHand(sortHand(store.getters.getSharedHandCards(), store.state.trumpSuit));
}

function initSortable() {
    const bottomCardsElem = document.getElementById('bottomCards');
    if (!bottomCardsElem) {
        console.error("initSortable() -- Did not find bottom cards");
        return 1;
    }
    sortableHandCards = new Sortable(bottomCardsElem, {
        disabled: false,
        group: 'shared',
        animation: 0,
        forceFallback: true,
        fallbackOnBody: true,
        fallbackTolerance: 3,
        emptyInsertThreshold: 60,
        filter: '.illegal',
        onAdd: (evt) => {
            if (store.getters.getGameTable()?.dropHeld) return;
            const card = elem2CardStr(evt.item);
            const hcs = store.getters.getSharedHandCards();
            if (hcs.includes(card)) {
                console.error("Hand onAdd -- card already in hand, dropping duplicate element:", card, hcs);
                evt.item.remove();
                return;
            }
            store.commit('setSharedHandCards', hcs.concat(card));
        },
        onRemove: (evt) => {
            if (store.getters.getGameTable()?.dropHeld) return;
            const card = elem2CardStr(evt.item);
            const hcs = store.getters.getSharedHandCards();
            const ind = hcs.indexOf(card);
            if (ind === -1) {
                console.error("Hand onRemove -- card not in hand:", card, hcs);
                return;
            }
            store.commit('setSharedHandCards', hcs.filter((_, i) => i !== ind));
        },
        onStart: (evt) => evt.item.classList.remove('spun'),
        onChange: (evt) => {
            if (evt.to.id === "bottomCards") {
                handifyCard(evt.item);
            } else {
                unHandifyCard(evt.item);
            }
        },
        onEnd: (evt) => dragEndHandlers.forEach(fn => fn(evt.item)),
    });

    bottomCardsElem.addEventListener("click", (evt) => {
        const card = evt.target.closest(".hand-card");
        if (card && bottomCardsElem.contains(card)) card.classList.toggle("spun");
    });
    return 0;
}

function incomingHandCards(cards) {
    if (!Array.isArray(cards) || cards.length !== 10 || !cards.every(isValidCardStr)) {
        console.error("incomingHandCards() -- expected 10 valid cards, got:", cards);
        return 1;
    }
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
    store.commit('setSharedHandCards', cards.slice());
    renderHand(cards);
    return 0;
}

function unHandifyCard(ele) {
    ele.classList.add("real-card");
    ele.classList.remove("bouncy", "hand-card", "spun", "illegal");
}

function handifyCard(ele) {
    ele.classList.remove("real-card");
    ele.classList.add("bouncy", "hand-card");
}

function handifyAllHandCards() {
    Array.from(document.getElementsByClassName("hand-card")).forEach((ele, i) => {
        setTimeout(() => handifyCard(ele), 75 * i);
    });
}

function renderHand(cards) {
    const cardsElement = document.getElementById('bottomCards');
    if (!cardsElement) {
        console.error("renderHand() -- Bottom cards not found");
        return 1;
    }
    cardsElement.innerHTML = cards.map(card => produceCardHtml(card, false, 'hand-card')).join('');
    handifyAllHandCards();
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

function setEnabled(enabled) {
    sortableHandCards?.option("disabled", !enabled);
}

defineExpose({ renderHand, incomingHandCards, unHandifyCard, handifyCard, markLegal, setEnabled })

onMounted(() => {
    initSortable();
    store.commit('setSharedHand', { renderHand, incomingHandCards, replaceHand, markLegal, setEnabled, handifyCard, unHandifyCard, onDragEnd });
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
    min-height: 214px;
    justify-content: center;
}

#bottomCards :deep(.hand-card) {
    transition: transform 0.15s, opacity 0.2s, filter 0.2s;
}

#bottomCards :deep(.hand-card > *) {
    width: 150px;
    height: 214px;
    background-color: white;
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
    bottom: 232px;
    right: 300px;
    padding: 8px 18px;
    font-size: 15px;
    font-weight: bold;
    color: #2c3e50;
    background: #ecf0f1;
    border: none;
    border-radius: 0;
    cursor: pointer;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
    z-index: 6;
}
.sort-button:hover {
    background: #f1c40f;
}

#bottomCards :deep(.illegal) {
    opacity: 0.45;
    filter: grayscale(0.7);
    cursor: not-allowed;
}

.portrait #bottomCards {
    width: 800px;
    flex-wrap: wrap;
    gap: 6px 0;
    min-height: 0;
}
.portrait #bottomCards :deep(.hand-card) {
    margin-right: -50px;
}
.portrait #bottomCards :deep(.hand-card > *) {
    width: 190px;
    height: 271px;
}
.portrait .sort-button {
    bottom: 565px;
    right: 20px;
}
</style>
