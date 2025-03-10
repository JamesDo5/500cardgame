<template>
    <div class="card-row" id="bottomCards">
        <div class="card-back hand-card"><img src="../assets/cards/cat_cardback.jpeg"></div>
        <div class="card-back hand-card"><img src="../assets/cards/cat_cardback.jpeg"></div>
        <div class="card-back hand-card"><img src="../assets/cards/cat_cardback.jpeg"></div>
        <div class="card-back hand-card"><img src="../assets/cards/cat_cardback.jpeg"></div>
        <div class="card-back hand-card"><img src="../assets/cards/cat_cardback.jpeg"></div>
        <div class="card-back hand-card"><img src="../assets/cards/cat_cardback.jpeg"></div>
        <div class="card-back hand-card"><img src="../assets/cards/cat_cardback.jpeg"></div>
        <div class="card-back hand-card"><img src="../assets/cards/cat_cardback.jpeg"></div>
        <div class="card-back hand-card"><img src="../assets/cards/cat_cardback.jpeg"></div>
        <div class="card-back hand-card"><img src="../assets/cards/cat_cardback.jpeg"></div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex'
import Sortable from 'sortablejs';
const emit = defineEmits(['hand-rendered'])
const store = useStore()


let sortableHandCards;
let handCards = store.state.sharedHandCards;

// See GameTable.vue for other sortables
async function initSortable() {
    const bottomCardsElem = document.getElementById('bottomCards');
    if (!bottomCardsElem) console.log("ERROR initSortable() -- Did not find bottom cards");
    sortableHandCards = new Sortable(bottomCardsElem, {
        // animation: 1000,
        disabled: false,
        group: 'shared',
        animation: 100,
        easing: 'easeOutCirc',
        onAdd: function (evt) {
            let hcs = store.getters.getSharedHandCards();
            hcs.push(cardStr2CardObj(src2CardStr(evt.item.firstElementChild.src)));
            // TODO assert new item is not already present in hand
            store.commit('setSharedHandCards', hcs);
        },
        onRemove: function (evt) {
            let hcs = store.getters.getSharedHandCards();
            // let ind = hcs.map(c => cardObj2Str(c)).indexOf(src2CardStr(evt.item.src));
            let ind = hcs.map(c => c.v + c.s).indexOf(src2CardStr(evt.item.firstElementChild.src));
            if (ind === -1) {
                console.log("ERROR in onRemove in sortableHandCards -- Removing a sortable elem from hand that isn't in store:", src2CardStr(evt.item.firstElementChild.src), hcs)
                return;
            }
            // TODO assert item is already present in hand
            hcs.splice(ind, 1);
            store.commit('setSharedHandCards', hcs);
        },
        onChange: (evt) => {
            if (evt.to.id === "bottomCards") {
                handifyCard(evt.item);
            } else {
                unHandifyCard(evt.item);
            }
            return;
        },
    });
    console.log("In Hand.vue initSortable -- Finished init!!!")

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
function src2CardStr(src) {
    // Input is a src string, output is a card string such as '2h'

    let jpgIndex = src.search(".jpeg");
    let startIndex = src.search("/src/assets/cards");
    if (jpgIndex - startIndex > 3 + 18) {
        // TODO raise error
        console.log("ERROR src2CardStr() -- That's not a card front:", src.slice(18, jpgIndex))
    }

    // 18 chars gets past /src/assets/cards/
    return src.slice(startIndex + 18, jpgIndex)
}

// Copied from GameTable.vue, needed in both right now. Once I get better at function sharing I will call it across components
// function cardObj2Str() {
//     // Input is a card object {v:J,s:d}. Output is a card string e.g. 'Jd'
//     return cardObj.v + cardObj.s
// }

// Copied from GameTable.vue, needed in both right now. Once I get better at function sharing I will call it across components
function cardStr2CardObj(cardStr) {
    // Input is a card string. Output is a card object {v:J,s:d}

    if (cardStr.slice(-1) === "j") {
        return { v: "", s: "j" }
    }

    return { v: cardStr.slice(0, -1), s: cardStr.slice(-1) }
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

// Different from the one in GameTable.vue
function produceCard(card, fd) {
    return `<div class="hand-card ${fd ? 'card-back' : `card-front ${getSuitClass(card.s)} `}"><img src="/src/assets/cards/${fd ? 'cat_cardback' : `${card.v}${card.s}`}.jpeg"></div>`
}

function unHandifyCard(ele) {
    ele.classList.add("real-card");
    ele.classList.remove("bouncy");
    ele.classList.remove("hand-card");

    ele.removeEventListener("click", function () {
        if (ele.classList.contains('spun')) {
            ele.classList.remove("spun");
        } else {
            ele.classList.add("spun");
        }
        return;
    });

    return 0
}

function handifyCard(ele) {
    ele.classList.remove("real-card");
    ele.classList.add("bouncy");
    ele.classList.add("hand-card");

    ele.addEventListener("click", function () {
        if (ele.classList.contains('spun')) {
            ele.classList.remove("spun");
        } else {
            ele.classList.add("spun");
        }
        return;
    });

    return 0
}

function handifyAllHandCards() {
    let handCardsArr = Array.from(document.getElementsByClassName("hand-card"));

    for (let i = 0; i < handCardsArr.length; i++) {
        setTimeout(() => handifyCard(handCardsArr[i]), 75 * i);
    }

    // Array.prototype.forEach.call(document.getElementsByClassName("hand-card"), (elem) => {
    //     elem.classList.add("bouncy");
    // });
}

function renderHand(cardsArr) {
    // Input: Arr of cards as strs e.g. ['2h', '8d', ...]
    // Output: Render cards into bottomCards and return success

    const cardsElement = document.getElementById('bottomCards');
    if (!cardsElement) console.log("ERROR Bottom cards not found");
    if (!cardsElement) return 1;
    // console.log('INFO Meesa rendering hand:',cardsArr)

    cardsElement.innerHTML = cardsArr.map(card => produceCard(card, false)).join('');

    // Array.from(cardsElement.children).forEach((c) => {c.classList.add("hand-card");});

    handifyAllHandCards();

    return 0;
}

defineExpose({ renderHand, incomingHandCards, unHandifyCard, handifyCard })

onMounted(() => {
    initSortable()
});
</script>

<style scoped>
/* Somehow these scoped styles are not getting applied to things generated by functions. Maybe I should modify the elems rather than genning,
but then the scoped styles won't apply when a card gets moved from a different place into this one */
.card-row {
    position: absolute;
    display: flex;
    gap: 10px;
}

#bottomCards {
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);

    /* Claude */
    perspective: 1000px;
    transform-style: preserve-3d;
}

#bottomCards :deep(.hand-card) {
    /* This is where stuff that needs to apply to the outer div goes */
    transition: transform 0.3s;
}

#bottomCards :deep(.hand-card > *) {
    /* This is where stuff that needs to apply to the images inside goes */
    width: 140px;
    height: 200px;
    background-color: white;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    will-change: transform;
    justify-content: center;
    align-items: center;
}

#bottomCards :deep(.spun) {
    transform: rotate(0.5turn);
}

#bottomCards :deep(.bouncy) {
    /* animation: MoveUpDown 2s linear infinite; */
}
@keyframes MoveUpDown {
    0%,
    100% {
        /* transform: translate(-50%, 0); */
        transform: translateY(0px);
    }
    60% {
        /* transform: translate(-50%, -4px); */
        transform: translateY(-3px);
    }
}
</style>