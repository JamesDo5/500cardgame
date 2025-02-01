<template>
    <div class="game-table-container">
        <div class="game-table">
            <!-- New stuff -->
            <img class="card card-played card-played-left" id="playedCardLeft" src="../assets/cards/mystery_card_cropped.jpg">
            <img class="card card-played card-played-top" id="playedCardTop" src="../assets/cards/mystery_card_cropped.jpg">
            <img class="card card-played card-played-right" id="playedCardRight"
                src="../assets/cards/mystery_card_cropped.jpg">
            <img class="card card-played card-played-bottom" id="playedCardBottom"
                src="../assets/cards/mystery_card_cropped.jpg">
            <!-- New stuff end -->
            <div class="card-row submit-cards" id="submitCards"></div>
            <!-- New stuff start again -->
            <div class="card-stack won-tricks-bottom" id="wonTricksBottom"></div>
            <div class="card-stack won-tricks-left" id="wonTricksLeft"></div>
            <div class="card-stack won-tricks-top" id="wonTricksTop"></div>
            <div class="card-stack won-tricks-right" id="wonTricksRight"></div>
            <div class="card-stack discard-blind" id="blindDiscard"></div>
            <!-- New stuff end again -->
        </div>
        <div class="card-row top-cards" id="topCards">
            <img class="card card-back" src="../assets/cards/cat_cardback.jpeg">
            <img class="card card-back" src="../assets/cards/cat_cardback.jpeg">
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
                <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
                <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
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
                <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
                <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
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
            <img class="card card-back" src="../assets/cards/cat_cardback.jpeg">
            <img class="card card-back" src="../assets/cards/cat_cardback.jpeg">
            <div class="card card-back">?</div>
            <div class="card card-back">?</div>
            <div class="card card-back">?</div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useStore } from 'vuex'
import Sortable from 'sortablejs';

const store = useStore()
let gameState = store.state.sharedGameState; // 0 is bidding, 1 is blind exchange, 2 is doing tricks, 3 is scoring and re-deal
let handCards = store.state.sharedHandCards;
const DEV_STANDALONE = true;
const emit = defineEmits(['gametable-ready'])
const allowedSuits = inject('cardSuits')
const allowedVals = inject('cardValues')

class GameTable {
    constructor() {
        // Array of strings which are card signatures
        this.blindCards = []; // Only if this player got blind, store after sending to server in case we need to re-send
        this.submitCards = [];
        // Array of strings which are card signatures. 0 is you, 1 is left, 2 top, 3 right.
        this.playedCards = ['', '', '', ''];
        // 0 is you, 1 is left, 2 top, 3 right
        this.lastTrickWinner = -1;
        // These are counts just tracking how high a stack is. Max 10.
        this.wonTricksBottom = 0;
        this.wonTricksLeft = 0;
        this.wonTricksTop = 0;
        this.wonTricksRight = 0;
        this.blindDiscard = false;

        this.sortableHandCards = null;
        this.sortableBlindCards = null;
        this.sortableSubmitCards = null;

        this.initializeSortables();
        this.initializeTable();
    }

    async initializeSortables() {
        this.sortableHandCards = new Sortable(document.getElementById('bottomCards'), {
            // animation: 1000,
            disabled: false,
            group: 'shared', 
        });
        this.sortableBlindCards = new Sortable(document.getElementById('blindCards'), {
            // animation: 1000,
            disabled: true,
            group: 'shared', 
        });
        // TODO try to limit submitCards to only 1 item after gameplay starts, perhaps with filter class on the cards in hand
        // ... if there's already one in the submit box -- {filter: '.filtered'}
        // However this may confuse user if trying to change submitted card out by adding one then removing one
        this.sortableSubmitCards = new Sortable(
            document.getElementById('submitCards'),
            // { disabled: true, group: 'shared', animation: 1000 }
            { disabled: true, group: 'shared' }
        );
    }

    async initializeTable() {
        try {
            // No need to render blind during normal play until websocket sends this player blind
            // this.renderBlind(this.blindCards, true)
            if (DEV_STANDALONE) {
                const shuffle = this.generateMockShuffle();
                this.blindCards = shuffle.slice(10, 15);
                store.commit('setSharedHandCards', shuffle.slice(35, 45))
                // v Commit above not reflected here without this getter for some reason
                handCards = store.getters.getSharedHandCards();
                this.renderHand(handCards)
                this.renderBlind(this.blindCards, true)
                // console.log("in initializeTable store.state.sharedHandCards.len:",handCards.length)
            }
        } catch (error) {
            console.error('Failed to initialize game table:', error);
        }

        // this.renderInitialCards();
    }

    generateMockShuffle() {
        const vals = ['4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const suits = ['h', 'd', 'c', 's'];
        // let possibilities = vals.reduce((acc, v) => {return acc.concat(suits.map(s => ({value:v,suit:s})));}, []).concat({value:'',suit:'j'});
        let possibilities = vals.flatMap(v => suits.map(s => ({ value: v, suit: s }))).concat({ value: '', suit: 'j' });

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
        //   value: vals[Math.floor(Math.random() * vals.length)],
        //   suit: suits[Math.floor(Math.random() * suits.length)]
        // })).concat({
        //   value: "",
        //   suit: "Joker"
        // });
    }

    parseCardFromSrc(src) {
        jpg_index = src.search(".jpeg");
        if (jpg_index-18 > 3) {
            // TODO raise error
            console.log("Umm Houston? That's not a card front:",src.slice(18,jpg_index))
        }
        // 18 chars gets past /src/assets/cards/
        return src.slice(18,jpg_index)
    }

    drawCard(card, fd) {
        return `<img class="card ${fd ? 'card-back' : `card-front ${this.getSuitClass(card.suit)} `}" src="/src/assets/cards/${fd ? 'cat_cardback' : `${card.value}${card.suit}`}.jpeg">`
    }

    getPosFromInt(pos) {
        // TODO maybe implement out of bounds checking
        const posArr = ["Bottom", "Left", "Top", "Right"];
        return posArr[pos]
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

    renderHand(cardsArr) {
        const cardsElement = document.getElementById('bottomCards');
        if (!cardsElement) console.log("bottom cards not found");
        if (!cardsElement) return;

        console.log('MeESA ReNDERING HaND:',cardsArr)

        cardsElement.innerHTML = cardsArr.map(card =>
            `<img class="card card-front ${this.getSuitClass(card.suit)}" src="/src/assets/cards/${card.value}${card.suit}.jpeg">`
        ).join('');
    }

    TESTFUNCswitchBlindFD() {
        let faceDown = true;

        const cardsElement = document.getElementById('blindCards');
        // TODO raise error
        if (!cardsElement) return 1;

        if (cardsElement.childNodes[0].classList.contains('card-back')) {
            // The goal of this function is to flip the blind so this bool is opposite of what is currently rendered
            faceDown = false;
        }

        // Now rerender the blind with the new faceDown
        cardsElement.innerHTML = this.blindCards.map(card =>this.drawCard(card,faceDown)).join('');

        // Note the use of faceDown to determine whether they are disabled
        this.sortableBlindCards.option("disabled", faceDown); // set

        return 0
    }

    renderBlind(cardsArr, faceDown) {
        // Store the blind in the source of truth
        this.blindCards = cardsArr.map(card => card.value + card.suit);

        const cardsElement = document.getElementById('blindCards');
        if (!cardsElement) return;

        cardsElement.innerHTML = cardsArr.map(card =>
            `<img class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)} `}" src="/src/assets/cards/${faceDown ? 'cat_cardback' : `${card.value}${card.suit}`}.jpeg">`
        ).join('');

        // <img class="card card-back section-member" src="/src/assets/cards/cat_cardback.jpeg">
        // <img class="card card-back" src="/src/assets/cards/cat_cardback.jpeg">
    }

    submitBlind() {
        const blindElement = document.getElementById('blindCards');
        if (!blindElement) return 1;

        // Disable sort during this function to prevent edge case inconsistencies
        this.sortableBlindCards.option("disabled", true);

        let blindSubmitArr = []

        console.log("blindElement.childNodes.length:", blindElement.childNodes.length)
        if (!(blindElement.childNodes.length === 5)) {
            // TODO raise error to user
            console.log("houston we have a problem! can't submit more or fewer than 5 card blind")
            // Reenable sorting so user can fix the issue
            this.sortableBlindCards.option("disabled", false);
            return 1
        }

        for (let i = 0; i < blindElement.childNodes.length; i++) {
            if (blindElement.childNodes[i].classList.contains('card-back')) {
                // TODO raise error to user
                console.log("houston we have a problem! can't submit cards which are facedown")
                blindSubmitArr = []
                this.sortableBlindCards.option("disabled", false);
                return 1
            }
            blindSubmitArr.push(blindElement.childNodes[i].innerHTML)
        }

        // TODO the code to send blind to server. If NOT worked do this block
        if (!true) {
            if (store.getters.getGameState() === 3) {
                store.commit('setGameState', 4);
            }
            return 1
        }

        lastTrickWinner = 0;
        this.sortableSubmitCards.option("disabled", false);
        blindElement.innerHTML = "";
        this.incomingBlindDiscard(lastTrickWinner);
        return 0
    }

    incomingBlindDiscard(pos) {
        if (!pos === lastTrickWinner)

        document.getElementById('blindDiscard').style.display = "inline";

        // TODO move the blind discard to correct player's position

        if (store.getters.getGameState() === 3) {
            store.commit('setGameState', 5);
        }
    }

    submitTrick() {
        let playedCardBottomElement = document.getElementById('playedCardBottom');
        const submitElement = document.getElementById('submitCards');
        if (!submitElement) return 1;

        // Disable sort during this function to prevent edge case inconsistencies
        this.sortableSubmitCards.option("disabled", true);

        if (!(submitElement.childNodes.length === 1)) {
            // TODO raise error to user
            console.log("houston we have a problem! can't submit more or fewer than 1 card for trick:",submitElement.childNodes.length)
            // Reenable sorting so user can fix the issue
            this.sortableSubmitCards.option("disabled", false);
            return 1
        }

        if (submitElement.childNodes[0].classList.contains('card-back')) {
            console.log("houston we have a problem! can't submit cards which are facedown")
            blindSubmitArr = []
            this.sortableSubmitCards.option("disabled", false);
            return 1
        }

        if (!this.playedCards[0] === '') {
            // TODO raise this error to user, they should get a little indicator that it's not allowed yet
            console.log("houston we have a problem! can't submit next trick before this one's over. current card:",this.playedCards[0])
            return 1
        }

        // TODO the code to send trick card to server. If it worked do this block
        if (true) {
            // Push card from submit box into played card table section
            playedCardBottomElement.style.display = "inline";
            playedCardBottomElement.src = submitElement.childNodes[0].src;
            submitElement.innerHTML = "";
            // Change state tracker
            this.playedCards[0] = this.parseCardFromSrc(submitElement.childNodes[0].src);
        }

        // Reenable sorting so next card can be played
        this.sortableSubmitCards.option("disabled", false);
        return 0
    }

    incomingTrickCard(pos, val, sui) {
        // Expecting pos as integer, 0 is you, 1 is left, 2 top, 3 right.

        // IF THIS DOESNT WORK MOVE ALLOWES SUITS etc INTO TABLE OBJECT (regrettably)
        if (!allowedSuits.has(sui)) {
            console.log("Hol* freakin moly we got a fake suit. Not allowed! :",sui);
            return 1;
        }
        if (!allowedVals.has(val)) {
            console.log("Hol* freakin moly we got a fake value. Not allowed! :",val);
            return 1;
        }
        if (pos < 0 || pos > 3) {
            console.log("Hol* mol* we got a fake position. Not allowed! :",pos,"pos yields",this.getPosFromInt(pos));
            return 1;
        }

        // TODO check who led and whether this pos is actually next (THIS IS IN DEV BUTTONS FOR NOW)

        if (!this.playedCards[pos] === '') {
            // TODO SEND error MESSAGE TO SERVER AND SET UP RESILIENCY HERE
            console.log("ERROR there's already a card in",this.getPosFromInt(pos),".",this.getPosFromInt(pos),"needs to wait until next turn!");
            return 1;
        }

        // Update this trick's state (source of truth)
        this.playedCards[pos] = val + sui;

        // Visually render new card
        document.getElementById('playedCard' + this.getPosFromInt(pos)).src = "/src/assets/cards/" + val + sui + ".jpeg";
        document.getElementById('playedCard' + this.getPosFromInt(pos)).className += " " + this.getSuitClass(sui);
        document.getElementById('playedCard' + this.getPosFromInt(pos)).style.display = "inline";

        // console.log("DEBUG playedCard",this.getPosFromInt(pos),":",
        //     window.getComputedStyle(
        //         document.getElementById('playedCard' + this.getPosFromInt(pos))
        //     ).display
        // )

        if (this.isTrickOver()) {
            this.endTrick();
        }

        return 0
    }

    isTrickOver() {
        if (this.lastTrickWinner === -1) {
            // TODO expose this error to user? Maybe add resiliency
            console.log("This is not good. LastTrickWinner is not set but we are in doTrickOverCheck. Trick state:",this.playedCards)
        }
        const didFullArrPlay = !this.playedCards.includes("");
        const didLastPlayerPlay = !this.playedCards[(this.lastTrickWinner + 1)%4] === "";
        if (!didFullArrPlay === didLastPlayerPlay) {
            // TODO add resiliency ask server here
            console.log("This is not good. Not everyone has played but the last player did somehow. Trick state:",this.playedCards)
        }

        return didLastPlayerPlay
    }

    endTrick() {
        sendTrickResultToServer();

        // Clear the arr storing the trick
        this.playedCards = ['', '', '', ''];

        // Clear the cards rendered
        playedCards = document.getElementsByClassName("card-played");
        for (let i = 0; i < playedCards.length; i++) {
            playedCards.item(i).src = "../assets/cards/cat_cardback.jpeg";
        }

    }

    sendTrickResultToServer() {
        // TODO send to server over ws
        return;
    }
}

onMounted(() => {
    const gt = new GameTable();

    // VueX state
    store.commit('setSharedGameTable', gt);

    // Event bus to the parent who will activate other things relying on game table to load
    emit('gametable-ready');
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

/* class="card card-played card-played-left" */
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
