<template>
    <div id="gameTableContainer">
        <div id="gameTable">
            <img class="fake-card card-played card-played-left" id="playedCardLeft" src="../assets/cards/mystery_card_cropped.jpg">
            <img class="fake-card card-played card-played-top" id="playedCardTop" src="../assets/cards/mystery_card_cropped.jpg">
            <img class="fake-card card-played card-played-right" id="playedCardRight" src="../assets/cards/mystery_card_cropped.jpg">
            <img class="fake-card card-played card-played-bottom" id="playedCardBottom" src="../assets/cards/mystery_card_cropped.jpg">
            <div class="card-row" id="submitCards">
                <div class="real-card card-back"><img src="../assets/cards/cat_cardback.jpeg"></div>
            </div>
            <div class="card-stack won-tricks-bottom" id="wonTricksBottom"></div>
            <div class="card-stack won-tricks-left" id="wonTricksLeft"></div>
            <div class="card-stack won-tricks-top" id="wonTricksTop"></div>
            <div class="card-stack won-tricks-right" id="wonTricksRight"></div>
            <div class="card-stack discard-blind" id="blindDiscard"></div>
        </div>
        <div class="card-row" id="blindCards">
            <div class="real-card card-back"><img src="../assets/cards/cat_cardback.jpeg"></div>
            <div class="real-card card-back"><img src="../assets/cards/cat_cardback.jpeg"></div>
            <div class="real-card card-back"><img src="../assets/cards/cat_cardback.jpeg"></div>
            <div class="real-card card-back"><img src="../assets/cards/cat_cardback.jpeg"></div>
            <div class="real-card card-back"><img src="../assets/cards/cat_cardback.jpeg"></div>
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
const emit = defineEmits(['gametable-ready', 'DEV-handincoming', 'handify-card', 'unhandify-card'])
const props = defineProps(['handfuncIncomingcards']);
const allowedSuits = inject('cardSuits')
const allowedVals = inject('cardValues')


class GameTable {
    constructor() {
        // Array of card objs e.g. [{v:J,s:d},{v:9,s:d}]. Downside of this over strs is that indexOf does not work natively :(
        this.blindCards = []; // Only if this player got blind, store after sending to server in case we need to re-send
        this.submitCards = [];
        // Array of strings which are card signatures. 0 is you, 1 is left, 2 top, 3 right.
        this.playedCards = ['', '', '', ''];
        // 0 is you, 1 is left, 2 top, 3 right
        this.lastTrickWinner = -1;
        // These are counts just tracking how high a stack is for each player. Max 10 total and 10 for 1 player.
        this.wonTricks = [0, 0, 0, 0];
        this.blindDiscard = false;

        this.sortableBlindCards = null;
        this.sortableSubmitCards = null;

        this.initializeSortables();
        this.initializeTable();
    }

    async initializeSortables() {
        // See Hand.vue for other Sortable
        const blindCardsElem = document.getElementById('blindCards');
        if (!blindCardsElem) console.log("ERROR initializeSortables() -- Did not find blind cards");
        const submitCardsElem = document.getElementById('submitCards');
        if (!submitCardsElem) console.log("ERROR initializeSortables() -- Did not find submittal cards");

        if ((!blindCardsElem) || (!submitCardsElem)) return 1;

        this.sortableBlindCards = new Sortable(blindCardsElem, {
            // animation: 1000,
            disabled: true,
            group: 'shared',
            onAdd: (evt) => {
                // TODO assert this item is not already present in blindCards
                this.blindCards.push(this.src2CardObj(evt.item.firstElementChild.src));
            },
            onRemove: (evt) => {
                let bc = this.blindCards;
                let ind = bc.map(c => this.cardObj2Str(c)).indexOf(this.src2CardStr(evt.item.firstElementChild.src));
                if (ind === -1) {
                    console.log("ERROR in onRemove in sortableBlindCards -- Removing a sortable elem from blind that isn't in this.blindCards:", this.src2CardStr(evt.item.firstElementChild.src), this.blindCards)
                    return;
                }
                this.blindCards.splice(ind, 1);
            },
            onChange: (evt) => {
                if (evt.to.id === "bottomCards") {
                    emit('handify-card', evt.item);
                    // handifyCard(evt.item);
                } else {
                    emit('unhandify-card', evt.item);
                    // unHandifyCard(evt.item);
                }
                return;
            },
        });
        // TODO try to limit submitCards to only 1 item after gameplay starts, perhaps with filter class on the cards in hand
        // ... if there's already one in the submit box -- {filter: '.filtered'}
        // However this may confuse user if trying to change submitted card out by adding one then removing one
        this.sortableSubmitCards = new Sortable(submitCardsElem, {
            disabled: true,
            group: 'shared',
            onAdd: (evt) => {
                this.submitCards.push(this.src2CardObj(evt.item.firstElementChild.src));
            },
            onRemove: (evt) => {
                let sc = this.submitCards;
                let ind = sc.map(c => this.cardObj2Str(c)).indexOf(this.src2CardStr(evt.item.firstElementChild.src));
                if (ind === -1) {
                    console.log("ERROR in onRemove in sortableSubmitCards -- Removing a sortable elem from submit box that isn't in this.submitCards:", this.src2CardStr(evt.item.firstElementChild.src), this.submitCards);
                    return;
                }
                this.submitCards.splice(ind, 1);
            },
            onChange: (evt) => {
                if (evt.to.id === "bottomCards") {
                    emit('handify-card', evt.item);
                    // handifyCard(evt.item);
                } else {
                    emit('unhandify-card', evt.item);
                    // unHandifyCard(evt.item);
                }
                return;
            },
        });
    }

    async initializeTable() {
        try {
            // Remove the submit card that starts displayed
            document.getElementById('submitCards').innerHTML = "";

            // No need to render blind during normal play until websocket sends this player blind
            // this.incomingBlind(this.blindCards, true)
            if (DEV_STANDALONE) {
                const shuffle = this.generateMockShuffle();
                this.blindCards = shuffle.slice(10, 15);

                // props.handfuncIncomingcards(shuffle.slice(35, 45))
                // Without the prop working for now we will make this commit and emit
                store.commit('setSharedHandCards', shuffle.slice(35, 45));
                emit('DEV-handincoming');

                // handCards = store.getters.getSharedHandCards();
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
        let possibilities = vals.flatMap(value => suits.map(suit => ({ v: value, s: suit }))).concat({ v: '', s: 'j' });

        // Fisher-Yates from James Bubb on dev.to, 2020 "How to shuffle an array in JavaScript"
        for (let i = possibilities.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = possibilities[i];
            possibilities[i] = possibilities[j];
            possibilities[j] = temp;
        }

        console.log(possibilities)

        return possibilities;
    }

    cardObj2Str(cardObj) {
        // Input is a card object {v:J,s:d}. Output is a card string e.g. 'Jd'

        return cardObj.v + cardObj.s
    }

    cardStr2CardObj(cardStr) {
        // Input is a card string. Output is a card object {v:J,s:d}

        if (cardStr.slice(-1) === "j") {
            return { v: "", s: "j" }
        }

        return { v: cardStr.slice(0, -1), s: cardStr.slice(-1) }
    }

    src2CardObj(src) {
        // Input is a src string. Output is a card string such as '2h'

        return this.cardStr2CardObj(this.src2CardStr(src))
    }

    src2CardStr(src) {
        // Input is a src string. Output is a card string such as '2h'

        let jpgIndex = src.search(".jpeg");
        let startIndex = src.search("/src/assets/cards");
        if (jpgIndex - startIndex > 3 + 18) {
            // TODO raise error
            console.log("ERROR src2CardStr() -- That's not a card front:", src.slice(18, jpgIndex))
        }

        // 18 chars gets past /src/assets/cards/
        return src.slice(startIndex + 18, jpgIndex)
    }

    produceCard(card, fd) {
        return `<div class="real-card ${fd ? 'card-back' : `card-front ${this.getSuitClass(card.s)} `}"><img src="/src/assets/cards/${fd ? 'cat_cardback' : `${card.v}${card.s}`}.jpeg"></div>`
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

    getFinishedTricks() {
        // Reduce code from florian-margaine on StackOverflow 03/25/2013
        return this.wonTricks.reduce((partialSum, n) => partialSum + n, 0);
    }

    TESTFUNCswitchBlindFD() {
        let faceDown = true;

        const cardsElement = document.getElementById('blindCards');
        // TODO raise error
        if (!cardsElement) console.log("ERROR Did not find blind cards");
        if (!cardsElement) return 1;

        if (cardsElement.childNodes[0].classList.contains('card-back')) {
            // The goal of this function is to flip the blind so this bool is opposite of what is currently rendered
            faceDown = false;
        }

        // Now rerender the blind with the new faceDown
        let bc = this.blindCards
        // TODO2 this is apparently not industry standard and it's better to use createElement
        cardsElement.innerHTML = bc.map(card => this.produceCard(card, faceDown)).join('');

        // Note the use of faceDown to determine whether they are disabled
        this.sortableBlindCards.option("disabled", faceDown); // set

        return 0
    }

    incomingBlind(cardsArr, faceDown) {
        // Input cardsArr is an array of Card objects. FaceDown is a bool
        // Output is rendering the blind

        // Store the blind in the source of truth
        this.blindCards = cardsArr.map(card => cardObj2Str(card));
        console.log("DEBUG in incomingBlind:", this.blindCards)

        const cardsElement = document.getElementById('blindCards');
        if (!cardsElement) console.log("ERROR Did not find blind cards");
        if (!cardsElement) return;

        cardsElement.innerHTML = cardsArr.map(card => this.produceCard(card, faceDown)).join('');

        return;
        // <img class="real-card card-back" src="/src/assets/cards/cat_cardback.jpeg">
    }

    submitBlind() {
        // Result: Check that blind cards rendered to the player matches this.blindCards, send CardStr array to server.
        // Output: 0 if successful, 1 if not.

        const blindElement = document.getElementById('blindCards');
        if (!blindElement) console.log("ERROR Did not find blind cards");
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
            blindSubmitArr.push(this.src2CardStr(blindElement.childNodes[i].firstElementChild.src))
        }

        // TODO now we have this.blindCards so we can check the rendered cards against the arr and just send the arr

        // TODO the code to send blind to server. If NOT worked do this block. TO BE CLEAR as this is set up now blindSubmitArr is an array of CardStrs
        if (!true) {
            if (store.getters.getGameState() === 3) {
                store.commit('setGameState', 4);
            }
            return 1;
        }

        this.incomingBlindDiscard(this.lastTrickWinner);
        return 0;
    }

    incomingBlindDiscard(pos) {
        // Input: Position 0-3 of player who finished blind.
        // Result: Render the blindDiscard next to player who won bid.
        // Output: 0 if successful.

        if (!pos === this.lastTrickWinner) {
            console.log("WARN in incomingBlindDiscard -- It seems the server thinks:", pos, "won the blind but client thinks:", this.lastTrickWinner, "won it. Believing server.");
            this.lastTrickWinner = pos;
        }

        document.getElementById('blindCards').style.display = "none";
        document.getElementById('blindDiscard').style.display = "inline";

        // TODO move the blind discard to correct player's position.

        if (store.getters.getGameState() === 3) {
            store.commit('setGameState', 5);
        }

        this.lastTrickWinner = 0;
        this.sortableSubmitCards.option("disabled", false);
        blindElement.innerHTML = "";

        return 0;
    }

    submitTrick() {
        // Result: Send this player's trick card submission to the server.
        // Output: 0 if successful, 1 if not.

        // TODO assert everyone from this.lastTrickWinner to my player has played

        // TODO now that we have this.submitCards, this can be simplified a lot
        let playedCardBottomElement = document.getElementById('playedCardBottom');
        const submitBoxElement = document.getElementById('submitCards');
        if (!submitBoxElement) return 1;

        // Disable sort during this function to prevent edge case inconsistencies
        this.sortableSubmitCards.option("disabled", true);

        if (submitBoxElement.childNodes.length !== 1) {
            // TODO raise error to user
            console.log("houston we have a problem! can't submit more or fewer than 1 card for trick:", submitBoxElement.childNodes.length)
            // Reenable sorting so user can fix the issue
            this.sortableSubmitCards.option("disabled", false);
            return 1
        }

        if (submitBoxElement.childNodes[0].classList.contains('card-back')) {
            console.log("houston we have a problem! can't submit cards which are facedown")
            blindSubmitArr = []
            this.sortableSubmitCards.option("disabled", false);
            return 1
        }

        if (this.playedCards[0] !== '') {
            // TODO raise this error to user, they should get a little animation that it's not allowed yet
            console.log("houston we have a problem! can't submit next trick before this one's over. current card:", this.playedCards[0])
            return 1
        }

        // TODO the code to send trick card to server. If it worked do this block
        if (true) {
            // TODO urgently replace this shiz with this.incomingTrickCard()
            // Push card from submit box into played card table section
            playedCardBottomElement.style.display = "inline";
            playedCardBottomElement.src = submitBoxElement.childNodes[0].firstElementChild.src;
            // Change state tracker
            this.playedCards[0] = this.src2CardStr(submitBoxElement.childNodes[0].firstElementChild.src);
            console.log("INFO Successfully submitted my card to server:", this.playedCards[0])
            submitBoxElement.innerHTML = "";
        }

        // Reenable sorting so next card can be played
        this.sortableSubmitCards.option("disabled", false);

        if (this.isTrickOver()) {
            this.endTrick();
        }

        return 0;
    }

    incomingTrickCard(pos, val, sui) {
        // Expecting pos as integer, 0 is you, 1 is left, 2 top, 3 right.

        // IF THIS DOESNT WORK MOVE cardSuits etc INTO TABLE OBJECT (regrettably)
        if (!allowedSuits.has(sui)) {
            console.log("Hol* freakin moly we got a fake suit. Not allowed! :", sui);
            return 1;
        }
        if (!allowedVals.has(val)) {
            console.log("Hol* freakin moly we got a fake value. Not allowed! :", val);
            return 1;
        }
        if (pos < 0 || pos > 3) {
            console.log("Hol* mol* we got a fake position. Not allowed! :", pos, "pos yields", this.getPosFromInt(pos));
            return 1;
        }

        // TODO check who led and whether this pos is actually next (THIS IS IN DEV BUTTONS FOR NOW)

        if (!this.playedCards[pos] === '') {
            // TODO SEND error MESSAGE TO SERVER AND SET UP RESILIENCY HERE
            console.log("ERROR there's already a card in", this.getPosFromInt(pos), ".", this.getPosFromInt(pos), "needs to wait until next turn!");
            return 1;
        }

        // Update this trick's state (source of truth)
        this.playedCards[pos] = val + sui;

        // Visually render new card
        // These are dead cards so no need to use producecard(). TODO Might be nice to make that a function for future though
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
            console.log("This is not good. LastTrickWinner is not set but we're checking isTrickOver(). Trick state:", this.playedCards);
        }
        const didFullArrPlay = !this.playedCards.includes("");
        const didLastPlayerPlay = !(this.playedCards[(this.lastTrickWinner + 3) % 4] === "");
        if (!didFullArrPlay === didLastPlayerPlay) {
            // TODO add resiliency ask server here
            console.log("DEBUG didFullArrPlay:", didFullArrPlay, "didLastPlayerPlay", didLastPlayerPlay, "first player:", this.lastTrickWinner, "last player:", (this.lastTrickWinner - 1) % 4,);
            console.log("This is not good. Last player vs all players have different play states. Trick state:", this.playedCards);
        }

        return didLastPlayerPlay
    }

    endTrick() {
        console.log("INFO endTrick() -- ending the trick!")
        this.lastTrickWinner = this.getTrickWinner();
        console.log("INFO endTrick() -- Announcing", this.lastTrickWinner, "won the trick!");

        this.wonTricks[this.lastTrickWinner] += 1;

        // TODO
        // sendTrickResultToServer();

        // Clear the arr storing the trick
        this.playedCards = ['', '', '', ''];

        // Clear the cards rendered
        Array.prototype.forEach.call(document.getElementsByClassName("card-played"), (elem) => {
            elem.firstElementChild.src = "/src/assets/cards/cat_cardback.jpeg";
            elem.style.display = "none";
        });

        if (this.isHandOver()) {
            this.endHand();
        }
    }

    isHandOver() {
        gameState = store.getters.getGameState();
        if (gameState === 5 && this.getFinishedTricks() === 10) {
            return true;
        }
        return false;
    }

    endHand() {
        const teamTricksWon = [
            this.wonTricks[0] + this.wonTricks[2],
            this.wonTricks[1] + this.wonTricks[2]
        ];

        const bb = store.getters.getBidBox();
        if (bb.getHighestBid() !== bb.bids[bb.winningBidder] || bb.getHighestBid() !== store.getters.getWinningBid()) {
            console.log("ERROR winning bidder's bid wasn't the highest somehow? Continuing...");
        }

        // Update score for non-bidwinning team
        const gc = store.getters.getGameCtlr();
        gc.scores[(bb.winningBidteam + 1) % 2] += teamTricksWon[(bb.winningBidteam + 1) % 2]

        // Update score for bidwinning team
        const neededTricks = Math.floor((bb.getHighestBid() + 560) / 100);
        if (teamTricksWon[bb.winningBidteam] >= neededTricks) {
            gc.scores[bb.winningBidteam] += 2 * bb.getHighestBid();
        }
        gc.scores[bb.winningBidteam] -= bb.getHighestBid();

        if (gc.isGameOver()) {
            gc.endGame();
            return;
        }

        // TODO Come on, can we consolidate some of this?
        bb.bids = [-1, -1, -1, -1];
        bb.winningBidder = -1;
        bb.winningBidteam = -1;
        store.commit('setWinningBid', -1);
        store.commit('advanceDealer');
        store.commit('setGameState', 0);
        this.wonTricks = [0, 0, 0, 0];

        return;
    }

    getTrickWinner() {
        const faceCardValues = new Map([['J', 11], ['Q', 12], ['K', 13], ['A', 14]]);
        let trumpSuit = store.getters.getTrumpSuit();
        let specialTrump = new Map([
            ['n', new Map()],
            ['s', new Map([['Jc', 15], ['Js', 16]])],
            ['c', new Map([['Js', 15], ['Jc', 16]])],
            ['d', new Map([['Jh', 15], ['Jd', 16]])],
            ['h', new Map([['Jd', 15], ['Jh', 16]])],
        ]);
        // TODO assert trumpSuit in specialTrump, otherwise console.log(`ERROR Sorry, we are out of suit: ${trumpSuit}.`);
        specialTrump = specialTrump.get(trumpSuit);
        console.log("DEBUG getTrickWinner -- trumpSuit:",trumpSuit)
        console.log("DEBUG getTrickWinner -- specialTrump after index:",specialTrump)

        // firstElementChild

        // switch (trumpSuit) {
        //     case 'n':
        //         specialTrump = new Map();
        //         break;
        //     case 's':
        //         specialTrump = new Map([['Jc', 15], ['Js', 16]]);
        //         break;
        //     case 'c':
        //         specialTrump = new Map([['Js', 15], ['Jc', 16]]);
        //         break;
        //     case 'd':
        //         specialTrump = new Map([['Jh', 15], ['Jd', 16]]);
        //         break;
        //     case 'h':
        //         specialTrump = new Map([['Jd', 15], ['Jh', 16]]);
        //         break;
        //     default:
        //         console.log(`ERROR Sorry, we are out of suit: ${trumpSuit}.`);
        //         return;
        // }

        let { _, ledSuit } = this.cardStr2CardObj(this.playedCards[this.lastTrickWinner]);
        // if (specialTrump.get(trumpSuit).has(this.playedCards[this.lastTrickWinner])) {
        if (specialTrump.has(this.playedCards[this.lastTrickWinner])) {
            ledSuit = trumpSuit;
        }

        let winningValue = 0, winningSuit = 'x';
        let currentTrickWinner = 0;
        let iValue, iSuit;
        for (let i = 0; i < this.playedCards.length; i++) {
            // TODO I REALLY DON'T THINK THIS DESTRUCTURE IS GONNA WORK
            ({ iValue, iSuit } = this.cardStr2CardObj(this.playedCards[i]));

            // Originally put j in specialTrump but it simplifies NoTrump tricks to just treat j as edge case
            if (iSuit === 'j') {
                return i;
            }

            if (specialTrump.has(this.playedCards[i])) {
                iSuit = trumpSuit;
                iValue = specialTrump.get(this.playedCards[i]);
            }
            if (faceCardValues.has(iValue)) {
                iValue = specialTrump.get(iValue);
            }

            if (iSuit === winningSuit && iValue < winningValue) {
                continue;
            }
            if (iSuit !== ledSuit && iSuit !== trumpSuit && winningSuit === ledSuit) {
                continue;
            }
            if (iSuit !== trumpSuit && winningSuit === trumpSuit) {
                continue;
            }

            currentTrickWinner = i;
            winningValue = iValue;
            winningSuit = iSuit;
        }

        console.log("INFO Got trick winner:", currentTrickWinner)
        return currentTrickWinner
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

#submitCards {
    bottom: -40px;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 2px dashed #7f8c8d;
    padding: 10px;
    min-width: 70px;
    min-height: 100px;
}
/* Cards in places that could in some circumstance be moved manually by player. Also considered naming 'activatable' */
#submitCards :deep(.real-card > *), #blindCards :deep(.real-card > *) {
  width: 70px;
  height: 100px;
  background-color: white;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  will-change: transform;
}

#gameTableContainer {
    position: relative;
    width: 1000px;
    height: 500px;
    bottom: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
}
#gameTable {
    width: 700px;
    height: 500px;
    background-color: #34495e;
    border-radius: 20px;
    position: absolute;
}

.card-row {
    position: absolute;
    display: flex;
    gap: 10px;
}

#blindCards {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
#blindCards :deep(.bouncy) {
    animation: MoveUpDown 2s linear infinite;
}
@keyframes MoveUpDown {

    0%,
    100% {
        transform: translateY(0px);
    }

    60% {
        transform: translateY(-3px);
    }
}
</style>
