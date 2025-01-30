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
            <div class="bottom-bid my-bid bid-display" id="bottomBid" style="display:none;color:white;">My Bid: 000
            </div>
            <div class="left-bid other-bid bid-display" id="leftBid" style="display:none;color:white;">Bid:<br />000
            </div>
            <div class="top-bid other-bid bid-display" id="topBid" style="display:none;color:white;">Bid: 000</div>
            <div class="right-bid other-bid bid-display" id="rightBid" style="display:none;color:white;">Bid:<br />000
            </div>
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

class GameTable {
    constructor() {
        // Array of strings
        this.blindCards = []; // Not sure this will be necessary since the WS will call the func
        this.submitCards = [];
        // These are strings because they can only ever be one card
        this.playedCardLeft = '';
        this.playedCardTop = '';
        this.playedCardRight = '';
        this.playedCardBottom = '';
        // 0 is you, 1 is left, 2 top, 3 right
        this.lastTrickWinner = -1;
        // These are counts just tracking how high a stack is
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
            // Element is dropped into the list from another list
            onAdd: function (evt) {
                // The id of the element
                evt.from.id
                // If I get this retooled to put each image in a div I think this works well. One other benefit is that I think it will make the dragging cleaner. Will see.
                evt.item.textContent
                // If I wanna be lazy and write a function to parse out the card value from the src
                evt.item.src
                // I don't think storing order in state is important because we won't be locally rerendering, aside from full page reload
            },
            // Element is removed from the list into another list
            onRemove: function (/**Event*/evt) {
                // same properties as onEnd
            },
            // Element dragging ended
            onEnd: function (/**Event*/evt) {
                var itemEl = evt.item;  // dragged HTMLElement
                evt.to;    // target list
                evt.from;  // previous list
                evt.oldIndex;  // element's old index within old parent
                evt.newIndex;  // element's new index within new parent
                evt.oldDraggableIndex; // element's old index within old parent, only counting draggable elements
                evt.newDraggableIndex; // element's new index within new parent, only counting draggable elements
                evt.clone // the clone element
                evt.pullMode;  // when item is in another sortable: `"clone"` if cloning, `true` if moving
            },
        });
        this.sortableBlindCards = new Sortable(document.getElementById('blindCards'), {
            // animation: 1000,
            disabled: true,
            group: 'shared', 
            // Element is dropped into the list from another list
            onAdd: function (/**Event*/evt) {
                // same properties as onEnd
            },
            // Element is removed from the list into another list
            onRemove: function (/**Event*/evt) {
                // same properties as onEnd
            },
            // Element dragging ended
            onEnd: function (/**Event*/evt) {
                var itemEl = evt.item;  // dragged HTMLElement
                evt.to;    // target list
                evt.from;  // previous list
                evt.oldIndex;  // element's old index within old parent
                evt.newIndex;  // element's new index within new parent
                evt.oldDraggableIndex; // element's old index within old parent, only counting draggable elements
                evt.newDraggableIndex; // element's new index within new parent, only counting draggable elements
                evt.clone // the clone element
                evt.pullMode;  // when item is in another sortable: `"clone"` if cloning, `true` if moving
            },
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

    drawCard(card) {
        return `<img class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)} `}" src="/src/assets/cards/${faceDown ? 'cat_cardback' : `${card.value}${card.suit}`}.jpeg">`
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
        cardsElement.innerHTML = this.blindCards.map(card =>drawCard(card)).join('');

        // Note the use of faceDown to determine whether they are disabled
        this.sortableBlindCards.option("disabled", faceDown); // set

        return 0
    }

    renderBlind(cardsArr, faceDown) {
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

        // TODO the code to send blind to server. If it worked do this block
        if (true) {
            this.sortableSubmitCards.option("disabled", false);
            blindElement.innerHTML = "";
        }

        return 0
    }

    submitTrick() {
        let playedCardBottomElement = document.getElementById('playedCardBottom');
        const submitElement = document.getElementById('submitCards');
        if (!submitElement) return 1;

        // Disable sort during this function to prevent edge case inconsistencies
        this.sortableSubmitCards.option("disabled", true);

        if (!(submitElement.childNodes.length === 1)) {
            // TODO raise error to user
            console.log("houston we have a problem! can't submit more or fewer than 1 card for trick")
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

        // TODO the code to send trick card to server. If it worked do this block
        if (true) {
            playedCardBottomElement.style.display = "inline";
            playedCardBottomElement.src = submitElement.childNodes[0].src;
            submitElement.innerHTML = "";
        }

        // Reenable sorting so next card can be played
        this.sortableSubmitCards.option("disabled", false);
        return 0
    }

    incomingTrickCard(pos, val, sui) {
        // IF THIS DOESNT WORK MOVE IT INTO TABLE OBJECT (regrettably)
        // allowedSuits = inject('cardSuits')
        // allowedVals = inject('cardValues')
        if (!inject('cardSuits').has(sui)) {
            console.log("Hol* freakin moly we got a fake suit. Not allowed! :",sui);
            return 1;
        }
        if (!inject('cardValues').has(val)) {
            console.log("Hol* freakin moly we got a fake value. Not allowed! :",val);
            return 1;
        }

        switch (pos) {
            case 'bottom':
                if (!this.playedCardBottom == '') {
                    // TODO SEND ERROR MESSAGE TO SERVER AND SET Up RESILIENCY HERE
                    console.log("Hol* moly there's already a card in bottom. Bottom needs to wait their turn!");
                    return 1;
                }
                this.playedCardBottom = val + sui;
                break;
            case 'left':
                if (!this.playedCardLeft == '') {
                    console.log("Hol* moly there's already a card in left. Left needs to wait their turn!");
                    return 1;
                }
                this.playedCardLeft = val + sui;
                break;
            case 'top':
                if (!this.playedCardTop == '') {
                    console.log("Hol* moly there's already a card in top. Top needs to wait their turn!");
                    return 1;
                }
                this.playedCardTop = val + sui;
                break;
            case 'right':
                if (!this.playedCardRight == '') {
                    console.log("Hol* moly there's already a card in right. Right needs to wait their turn!");
                    return 1;
                }
                this.playedCardRight = val + sui;
                break;
            default:
                console.log("Hol* freakin moly we got a fake position. Not allowed! :",pos);
                return 1;
        }
        return 0
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
