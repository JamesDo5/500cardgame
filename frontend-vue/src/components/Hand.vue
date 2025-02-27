<template>
    <div class="card-row" id="bottomCards">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex'
import Sortable from 'sortablejs';
const emit = defineEmits(['hand-rendered'])
const store = useStore()


let bottomCardsElem;
let sortableHandCards;
let handCards = store.state.sharedHandCards;

function initSortable() {
    bottomCardsElem = document.getElementById('bottomCards');
    if (!bottomCardsElem) console.log("ERROR initializeSortables() -- Did not find bottom cards");
    sortableHandCards = new Sortable(bottomCardsElem, {
        // animation: 1000,
        disabled: false,
        group: 'shared', 
    });

    if (!bottomCardsElem) return 1;
}

function incomingHandCards(shuf) {
    // TODO assertion shuf expected to be array of size 10 with 10 valid cards

    store.commit('setSharedHandCards', shuf);
    // v Commit above not reflected here without this getter for some reason. This stores the var to be used elsewhere
    handCards = store.getters.getSharedHandCards();

    renderHand(shuf);

    // console.log("In Hand.vue incomingHandCards -- Rendered hand!!!")
    emit('hand-rendered');
}

// Copied from GameTable.vue, needed in both right now. Once I get better at function sharing I will call it across components
function getSuitClass(suit) {
    switch (suit) {
        case 'h': return 'hearts';
        case 'd': return 'diamonds';
        case 'c': return 'clubs';
        case 's': return 'spades';
        case 'j': return 'joker';
        default: return '';
    }
}

function produceCard(card, fd) {
    return `<img class="card ${fd ? 'card-back' : `card-front ${getSuitClass(card.suit)} `}" src="/src/assets/cards/${fd ? 'cat_cardback' : `${card.value}${card.suit}`}.jpeg">`
}

function makeHandBouncy() {
    let handCardsArr = Array.from(document.getElementsByClassName("hand-card"));

    for (let i = 0; i < handCardsArr.length; i++) {

        // handCardsArr[i].classList.add("bouncy")
        // setTimeout(() => handCardsArr[i].classList.add("bouncy"), 20*i);
        setTimeout(() => handCardsArr[i].className += " bouncy", 20*i);
    }

    // Array.prototype.forEach.call(document.getElementsByClassName("card-played"), (elem) => {
    //     elem.classList.add("bouncy");
    // });
}

function renderHand(cardsArr) {
    const cardsElement = document.getElementById('bottomCards');
    if (!cardsElement) console.log("ERROR Bottom cards not found");
    if (!cardsElement) return;
    // console.log('INFO Meesa rendering hand:',cardsArr)

    cardsElement.innerHTML = cardsArr.map(card => produceCard(card,false)).join('');

    Array.from(cardsElement.children).forEach((c) => {c.classList.add("hand-card");});

    // makeHandBouncy();
}

defineExpose({renderHand, incomingHandCards})

onMounted(() => {
    initSortable()
});
</script>

<style scoped>
.card-row {
  position: absolute;
  display: flex;
  gap: 10px;
}
#bottomCards {
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  /* BELOW ARE FROM CHATGPT */
  /* transition: transform 0.3s ease; */
  /* transform-style: preserve-3d; */
}
.flipped {
    transform: rotateY(180deg);
    perspective: 1000px;
}
.bouncy {
  animation: MoveUpDown 2s linear infinite;
}
@keyframes MoveUpDown {
  0%, 100% {
    /* transform: translate(-50%, 0); */
    transform: translateY(0);
  }
  75% {
    /* transform: translate(-50%, -4px); */
    transform: translateY(-4px);
  }
}

</style>