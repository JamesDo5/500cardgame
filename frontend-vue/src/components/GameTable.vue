<template>
    <div class="game-table-container">
        <div class="game-table">
            <!-- New stuff -->
            <img class="card card-played card-played-left" id="playedCardLeft" src="../assets/mystery_card_cropped.jpg">
            <img class="card card-played card-played-top" id="playedCardTop" src="../assets/mystery_card_cropped.jpg">
            <img class="card card-played card-played-right" id="playedCardRight"
                src="../assets/mystery_card_cropped.jpg">
            <img class="card card-played card-played-bottom" id="playedCardBottom"
                src="../assets/mystery_card_cropped.jpg">
            <!-- New stuff end -->
            <div class="card-row submit-cards" id="submitCards"></div>
            <!-- New stuff start again -->
            <div class="card-stack won-tricks-bottom" id="wonTricksBottom"></div>
            <div class="card-stack won-tricks-left" id="wonTricksLeft"></div>
            <div class="card-stack won-tricks-top" id="wonTricksTop"></div>
            <div class="card-stack won-tricks-right" id="wonTricksRight"></div>
            <div class="card-stack discard-blind" id="blindDiscard"></div>
            <!-- New stuff end again -->
            <div class="bottom-bid my-bid bid-display" id="bottomBid" style="display:none;color:white;">My Bid: 000
            </div>
            <div class="left-bid other-bid bid-display" id="leftBid" style="display:none;color:white;">Bid:<br />000
            </div>
            <div class="top-bid other-bid bid-display" id="topBid" style="display:none;color:white;">Bid: 000</div>
            <div class="right-bid other-bid bid-display" id="rightBid" style="display:none;color:white;">Bid:<br />000
            </div>
        </div>
        <div class="card-row top-cards" id="topCards">
            <img class="card card-back" src="../assets/cat_cardback.jpg">
            <img class="card card-back" src="../assets/cat_cardback.jpg">
            <div class="card card-back">?</div>
            <div class="card card-back">?</div>
            <div class="card card-back">?</div>
            <div class="card card-back">?</div>
            <div class="card card-back">?</div>
            <div class="card card-back">?</div>
            <div class="card card-back">?</div>
            <div class="card card-back">?</div>
        </div>
        <div class="card-row bottom-cards" id="bottomCards">
            <div class="card card-front spades">4♠</div>
            <div class="card card-front spades">4♠</div>
            <div class="card card-front spades">4♠</div>
            <div class="card card-front spades">4♠</div>
            <div class="card card-front spades">4♠</div>
            <div class="card card-front spades">4♠</div>
            <div class="card card-front spades">4♠</div>
            <div class="card card-front spades">4♠</div>
            <div class="card card-front spades">4♠</div>
            <div class="card card-front spades">4♠</div>
        </div>
        <div class="card-halfrow left-cards" id="leftCards">
            <div class="section">
                <img class="card card-back section-member" src="../assets/cat_cardback.jpg">
                <img class="card card-back section-member" src="../assets/cat_cardback.jpg">
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
            </div>
            <div class="section">
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
            </div>
        </div>
        <div class="card-halfrow right-cards" id="rightCards">
            <div class="section">
                <img class="card card-back section-member" src="../assets/cat_cardback.jpg">
                <img class="card card-back section-member" src="../assets/cat_cardback.jpg">
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
            </div>
            <div class="section">
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
                <div class="card card-back section-member">?</div>
            </div>
        </div>
        <div class="card-row blind-cards" id="blindCards">
            <img class="card card-back" src="../assets/cat_cardback.jpg">
            <img class="card card-back" src="../assets/cat_cardback.jpg">
            <div class="card card-back">?</div>
            <div class="card card-back">?</div>
            <div class="card card-back">?</div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex'
import Sortable from 'sortablejs';

const store = useStore()
let gameState = store.state.sharedGameState; // 0 is bidding, 1 is blind exchange, 2 is doing tricks, 3 is scoring and re-deal
let handCards = store.state.sharedHandCards;
const STANDALONE = true;
const emit = defineEmits(['gametable-ready'])

class GameTable {
    constructor() {
        // Array of strings
        this.blindCards = [];
        this.submitCards = [];
        // v These are strings because they can only ever be one card
        this.playedCardLeft = '';
        this.playedCardTop = '';
        this.playedCardRight = '';
        this.playedCardBottom = '';
        // v These are counts just tracking how high a stack is
        this.wonTricksBottom = 0;
        this.wonTricksLeft = 0;
        this.wonTricksTop = 0;
        this.wonTricksRight = 0;
        this.blindDiscard = false;

        this.initializeTable();
    }

    async initializeTable() {
        try {
            // No need to render blind during normal play until websocket sends this player blind
            // this.renderBlind(this.blindCards, true)
            if (STANDALONE) {
                const shuffle = this.generateMockShuffle();
                this.blindCards = shuffle.slice(10, 15);
                store.commit('setSharedHandCards', shuffle.slice(35, 45))
                this.renderHand(handCards)
                this.renderBlind(this.blindCards, true)
            }
        } catch (error) {
            console.error('Failed to initialize game table:', error);
        }

        // this.renderInitialCards();
    }

    generateMockShuffle() {
        const values = ['4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const suits = ['h', 'd', 'c', 's'];
        // let possibilities = values.reduce((acc, v) => {return acc.concat(suits.map(s => ({value:v,suit:s})));}, []).concat({value:'',suit:'j'});
        let possibilities = values.flatMap(v => suits.map(s => ({ value: v, suit: s }))).concat({ value: '', suit: 'j' });

        // Fisher-Yates from James Bubb on dev.to
        for (let i = possibilities.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = possibilities[i];
            possibilities[i] = possibilities[j];
            possibilities[j] = temp;
        }

        console.log(possibilities)

        return possibilities;
        // return Array.from({ length: 44 }, () => ({
        //   value: values[Math.floor(Math.random() * values.length)],
        //   suit: suits[Math.floor(Math.random() * suits.length)]
        // })).concat({
        //   value: "",
        //   suit: "Joker"
        // });
    }

    renderCardRow(rowId, cards, faceDown) {
        const cardsElement = document.getElementById(rowId);
        if (!cardsElement) return;

        cardsElement.innerHTML = cards.map(card =>
            `<div class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)} `}">
                ${faceDown ? '?' : `${card.value}${card.suit}`}
             </div>`
        ).join('');
    }

    renderHand(cardsArr) {
        const cardsElement = document.getElementById('bottomCards');
        if (!cardsElement) return;

        cardsElement.innerHTML = cardsArr.map(card =>
            `<img class="card ${`card-front ${this.getSuitClass(card.suit)} `}" src="../assets/${card.value}${card.suit}.jpeg">`
        ).join('');
    }

    renderBlind(cardsArr, faceDown) {
        let fD = faceDown;

        const cardsElement = document.getElementById('blindCards');
        if (!cardsElement) return;

        if (cardsElement.childNodes[0].classList.contains('card-back')) {
            // The goal of this function is to flip the blind so this bool is opposite of what is currently rendered
            fD = false;
        }

        cardsElement.innerHTML = cardsArr.map(card =>
            `<img class="card ${fD ? 'card-back' : `card-front ${this.getSuitClass(card.suit)} `}" src="../assets/${fD ? 'cat_cardback' : `${card.value}${card.suit}`}.jpeg">`
        ).join('');


        // <img class="card card-back section-member" src="../assets/cat_cardback.jpg">
        // <img class="card card-back" src="../assets/cat_cardback.jpg">
    }

    fetchBlind() {
        // TODO make this function a call to server and if fails use preset this.blindcards if in testing env
        let faceDown = true;

        const blindElement = document.getElementById('blindCards');
        if (!blindElement) return;

        if (blindElement.childNodes[0].classList.contains('card-back')) {
            // The goal of this function is to flip the blind so this bool is opposite of what is currently rendered
            faceDown = false;
        }

        // Now rerender the blind with the new faceDown
        blindElement.innerHTML = this.blindCards.map(card =>
            `<div class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)}`} ">
                ${faceDown ? '?' : `${card.value}${card.suit}`}
             </div>`
        ).join('');

        // Note the use of faceDown to determine whether they are disabled
        sortableBlindCards.option("disabled", faceDown); // set

        return 0
    }

    submitBlind() {
        const blindElement = document.getElementById('blindCards');
        if (!blindElement) return 1;

        // Disable sort during this function to prevent edge case inconsistencies
        sortableBlindCards.option("disabled", true);

        let blindSubmitArr = []

        console.log("blindElement.childNodes.length:", blindElement.childNodes.length)
        if (!(blindElement.childNodes.length === 5)) {
            // TODO raise error to user
            console.log("houston we have a problem! can't submit more or fewer than 5 card blind")
            // Reenable sorting so user can fix the issue
            sortableBlindCards.option("disabled", false);
            return 1
        }

        for (let i = 0; i < blindElement.childNodes.length; i++) {
            if (blindElement.childNodes[i].classList.contains('card-back')) {
                // TODO raise error to user
                console.log("houston we have a problem! can't submit cards which are facedown")
                blindSubmitArr = []
                sortableBlindCards.option("disabled", false);
                return 1
            }
            blindSubmitArr.push(blindElement.childNodes[i].innerHTML)
        }

        // TODO the code to send blind to server. If it worked do this block
        if (true) {
            sortableSubmitCards.option("disabled", false);
            blindElement.innerHTML = "";
        }

        return 0
    }

    submitTrick() {
        let playedCardBottomElement = document.getElementById('playedCardBottom');
        const submitElement = document.getElementById('submitCards');
        if (!submitElement) return 1;

        // Disable sort during this function to prevent edge case inconsistencies
        sortableSubmitCards.option("disabled", true);

        if (!(submitElement.childNodes.length === 1)) {
            // TODO raise error to user
            console.log("houston we have a problem! can't submit more or fewer than 1 card for trick")
            // Reenable sorting so user can fix the issue
            sortableSubmitCards.option("disabled", false);
            return 1
        }

        if (submitElement.childNodes[0].classList.contains('card-back')) {
            console.log("houston we have a problem! can't submit cards which are facedown")
            blindSubmitArr = []
            sortableSubmitCards.option("disabled", false);
            return 1
        }

        // TODO the code to send trick card to server. If it worked do this block
        if (true) {
            playedCardBottomElement.style.display = "inline";
            playedCardBottomElement.src = submitElement.childNodes[0].src;
            submitElement.innerHTML = "";
        }

        // Reenable sorting so next card can be played
        sortableSubmitCards.option("disabled", false);
        return 0
    }

    incomingTrickPlay() {
        const helloTODO = 1;
    }

    getSuitClass(suit) {
        switch (suit) {
            case 'h': return 'hearts';
            case 'd': return 'diamonds';
            case 'c': return 'clubs';
            case 's': return 'spades';
            case 'j': return 'joker';
            default: return '';
        }
    }
}

onMounted(() => {
    const gt = new GameTable()

    // VueX state
    store.commit('setSharedGameTable', gt)

    // Event bus to the parent who will activate other things relying on game table to load
    emit('gametable-ready')

    const sortableHandCards = new Sortable(
        document.getElementById('bottomCards'),
        { disabled: false, group: 'shared', animation: 1000 }
    );
    const sortableBlindCards = new Sortable(
        document.getElementById('blindCards'),
        { disabled: true, group: 'shared', animation: 1000 }
    );
    // TODO try to limit submitCards to only 1 item after gameplay starts, perhaps with filter class on the cards in hand
    // ... if there's already one in the submit box -- {filter: '.filtered'}
    // However this may confuse user if trying to change submitted card out by adding one then removing one
    const sortableSubmitCards = new Sortable(
        document.getElementById('submitCards'),
        { disabled: true, group: 'shared', animation: 1000 }
    );
})
</script>

<style scoped>
/* There is no other sub-class, this is just facedown tricks and blind */
.card-stack {
    width: 70px;
    height: 100px;
    border-radius: 8px;
    align-items: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
    will-change: transform;
    background-color: #3498db;
    color: white;
    font-weight: bold;
    position: absolute;
    display: none;
}

.won-tricks-left {
    top: 60%;
    left: 8%;
    transform: translate(-50%, -50%) rotate(90deg);
}

.won-tricks-top {
    top: 10%;
    left: 35%;
    transform: translate(-50%, -50%) rotate(180deg);
}

.won-tricks-right {
    top: 40%;
    left: 92%;
    transform: translate(-50%, -50%) rotate(270deg);
}

.won-tricks-bottom {
    top: 90%;
    left: 70%;
    /* No idea why but putting this translate in card-stack created completely different behavior...? */
    transform: translate(-50%, -50%);
}

.discard-blind {
    top: 90%;
    left: 25%;
    transform: translate(-50%, -50%) rotate(0deg);
    /* transform: translate(-50%, -50%) rotate(270deg); */
}

.card-played {
    position: absolute;
    display: none;
}

.card-played-left {
    top: 50%;
    left: 40%;
    transform: translate(-50%, -50%) rotate(90deg);
    z-index: 3;
}

.card-played-top {
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(180deg);
    z-index: 2;
}

.card-played-right {
    top: 50%;
    left: 60%;
    transform: translate(-50%, -50%) rotate(270deg);
    z-index: 1;
}

.card-played-bottom {
    top: 60%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 4;
}

.submit-cards {
    bottom: -40px;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 2px dashed #7f8c8d;
    padding: 10px;
    min-width: 70px;
    min-height: 100px;
}
</style>