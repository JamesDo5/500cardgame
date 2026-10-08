<template>
    <div id="gameTableContainer">
        <div id="gameTable">
            <img class="fake-card card-played card-played-left" id="playedCardLeft" :src="CARD_BACK_URL">
            <img class="fake-card card-played card-played-top" id="playedCardTop" :src="CARD_BACK_URL">
            <img class="fake-card card-played card-played-right" id="playedCardRight" :src="CARD_BACK_URL">
            <img class="fake-card card-played card-played-bottom" id="playedCardBottom" :src="CARD_BACK_URL">
            <div class="card-row" id="submitCards"></div>
            <div class="card-stack won-tricks-bottom" id="wonTricksBottom"></div>
            <div class="card-stack won-tricks-left" id="wonTricksLeft"></div>
            <div class="card-stack won-tricks-top" id="wonTricksTop"></div>
            <div class="card-stack won-tricks-right" id="wonTricksRight"></div>
            <div class="card-stack discard-blind" id="blindDiscard"></div>
        </div>
        <div class="card-row" id="blindCards"></div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex'
import Sortable from 'sortablejs';
import { STANDALONE } from '../config.js';
import { socket } from '../net/socket.js';
import { C2S } from '../net/messages.js';
import { CARD_BACK_URL, cardImageUrl, cardStr2CardObj, elem2CardStr, getPosName, getSuitClass, isValidCardStr, produceCardHtml, dealMock, teamOf } from '../game/cards.js';
import { trickWinner, legalPlays, nextToPlay, scoreHand, gameOutcome } from '../game/rules.js';

const store = useStore()

const names = () => store.state.playerNames;

class GameTable {
    constructor() {
        this.blindCards = [];
        this.submitCards = [];
        this.playedCards = ['', '', '', ''];
        this.lastTrickWinner = -1;
        this.predictedTrickWinner = -1;
        this.wonTricks = [0, 0, 0, 0];
        this.mockHands = null;
        this.mockBlind = null;
        this.sortableBlindCards = null;
        this.sortableSubmitCards = null;
        this.initializeSortables();
    }

    initializeSortables() {
        const blindCardsElem = document.getElementById('blindCards');
        const submitCardsElem = document.getElementById('submitCards');
        if (!blindCardsElem || !submitCardsElem) {
            console.error("initializeSortables() -- missing blind or submit element");
            return 1;
        }
        const handOrNot = (evt) => {
            if (evt.to.id === "bottomCards") store.getters.getHand().handifyCard?.(evt.item);
        };
        this.sortableBlindCards = new Sortable(blindCardsElem, {
            disabled: true,
            group: 'shared',
            animation: 100,
            onAdd: (evt) => this.trackAdd(this.blindCards, evt.item, 'blind'),
            onRemove: (evt) => this.trackRemove(this.blindCards, evt.item, 'blind'),
            onChange: handOrNot,
        });
        this.sortableSubmitCards = new Sortable(submitCardsElem, {
            disabled: true,
            group: 'shared',
            animation: 100,
            onAdd: (evt) => this.trackAdd(this.submitCards, evt.item, 'submit'),
            onRemove: (evt) => this.trackRemove(this.submitCards, evt.item, 'submit'),
            onChange: handOrNot,
        });
        return 0;
    }

    trackAdd(arr, item, label) {
        const card = elem2CardStr(item);
        if (arr.includes(card)) {
            console.error(`onAdd ${label} -- card already present:`, card, arr);
            return;
        }
        arr.push(card);
        this.unHandify(item);
    }

    trackRemove(arr, item, label) {
        const ind = arr.indexOf(elem2CardStr(item));
        if (ind === -1) {
            console.error(`onRemove ${label} -- card not tracked:`, elem2CardStr(item), arr);
            return;
        }
        arr.splice(ind, 1);
    }

    unHandify(item) {
        item.classList.add("real-card");
        item.classList.remove("bouncy", "hand-card", "spun", "illegal");
    }

    newHand() {
        this.blindCards = [];
        this.submitCards = [];
        this.playedCards = ['', '', '', ''];
        this.lastTrickWinner = -1;
        this.predictedTrickWinner = -1;
        this.wonTricks = [0, 0, 0, 0];
        this.mockHands = null;
        this.mockBlind = null;
        document.getElementById('submitCards').innerHTML = "";
        document.getElementById('blindCards').innerHTML = "";
        document.getElementById('blindCards').style.display = "flex";
        document.getElementById('blindDiscard').style.display = "none";
        this.sortableBlindCards.option("disabled", true);
        this.sortableSubmitCards.option("disabled", true);
        this.clearPlayedCards();
        this.renderStacks();
        store.commit('setTrumpSuit', '');
        store.commit('setWinningBid', -1);
        store.getters.getHand()?.markLegal(null);
    }

    dealStandalone() {
        const { hands, blind } = dealMock();
        this.newHand();
        this.mockHands = hands;
        this.mockBlind = blind;
        store.getters.getBidBox().reset();
        store.getters.getHand().incomingHandCards(hands[0]);
        store.commit('setGameState', 1);
        store.commit('feedPush', `${names()[store.state.dealer]} dealt.`);
        store.getters.getBidBox().show();
    }

    incomingBlind(cards, faceDown) {
        if (!Array.isArray(cards) || cards.length !== 5 || !cards.every(isValidCardStr)) {
            console.error("incomingBlind() -- expected 5 valid cards:", cards);
            return 1;
        }
        this.blindCards = cards.slice();
        this.renderBlind(faceDown);
        return 0;
    }

    renderBlind(faceDown) {
        const cardsElement = document.getElementById('blindCards');
        cardsElement.style.display = "flex";
        cardsElement.innerHTML = this.blindCards.map(card => produceCardHtml(card, faceDown, 'real-card')).join('');
        this.sortableBlindCards.option("disabled", faceDown);
    }

    flipBlind() {
        const first = document.getElementById('blindCards').firstElementChild;
        if (!first) return 1;
        this.renderBlind(!first.classList.contains('card-back'));
        return 0;
    }

    submitBlind() {
        const blindElement = document.getElementById('blindCards');
        this.sortableBlindCards.option("disabled", true);
        const items = Array.from(blindElement.children);
        if (items.length !== 5) {
            store.commit('notify', "Discard exactly 5 cards to the blind.");
            this.sortableBlindCards.option("disabled", false);
            return 1;
        }
        if (items.some(ele => ele.classList.contains('card-back'))) {
            store.commit('notify', "Flip the blind over before submitting.");
            this.sortableBlindCards.option("disabled", false);
            return 1;
        }
        const discards = items.map(elem2CardStr);
        if (store.getters.getSharedHandCards().length !== 10) {
            store.commit('notify', "You must hold exactly 10 cards.");
            this.sortableBlindCards.option("disabled", false);
            return 1;
        }
        this.blindCards = discards;
        store.commit('setGameState', 4);
        if (STANDALONE) {
            this.incomingBlindDiscard(0);
        } else {
            socket.send(C2S.SUBMIT_BLIND, { discards });
        }
        return 0;
    }

    incomingBlindDiscard(pos) {
        const bb = store.getters.getBidBox();
        if (pos !== bb.winningBidder) {
            console.warn("incomingBlindDiscard -- server says", pos, "finished blind but client thought bid winner was", bb.winningBidder, ". Believing server.");
            bb.winningBidder = pos;
            bb.winningBidTeam = teamOf(pos);
        }
        document.getElementById('blindCards').style.display = "none";
        document.getElementById('blindCards').innerHTML = "";
        document.getElementById('blindDiscard').style.display = "inline";
        this.lastTrickWinner = pos;
        this.sortableSubmitCards.option("disabled", false);
        store.commit('setGameState', 5);
        store.commit('feedPush', `${names()[pos]} took the blind and leads.`);
        this.updateLegalHighlights();
        return 0;
    }

    botBlind(pos) {
        if (!STANDALONE || !this.mockHands) return 1;
        const all = this.mockHands[pos].concat(this.mockBlind);
        for (let i = 0; i < 5; i++) all.splice(Math.floor(Math.random() * all.length), 1);
        this.mockHands[pos] = all;
        return this.incomingBlindDiscard(pos);
    }

    submitTrick() {
        const submitBoxElement = document.getElementById('submitCards');
        this.sortableSubmitCards.option("disabled", true);
        const reenable = () => this.sortableSubmitCards.option("disabled", false);

        if (store.state.gameState !== 5) {
            store.commit('notify', "Trick play hasn't started.");
            reenable();
            return 1;
        }
        if (submitBoxElement.children.length !== 1) {
            store.commit('notify', "Put exactly one card in the play box.");
            reenable();
            return 1;
        }
        if (nextToPlay(this.playedCards, this.lastTrickWinner) !== 0) {
            store.commit('notify', "It's not your turn.");
            reenable();
            return 1;
        }
        const card = elem2CardStr(submitBoxElement.firstElementChild);
        const legal = legalPlays(store.getters.getSharedHandCards().concat(card), this.playedCards, this.lastTrickWinner, store.state.trumpSuit);
        if (!legal.includes(card)) {
            store.commit('notify', "You must follow suit.");
            reenable();
            return 1;
        }

        submitBoxElement.innerHTML = "";
        this.submitCards = [];
        this.incomingTrickCard(0, card, false);
        if (!STANDALONE) socket.send(C2S.PLAY_CARD, { card });
        reenable();
        return 0;
    }

    incomingTrickCard(pos, card, auto = false) {
        if (!isValidCardStr(card)) {
            console.error("incomingTrickCard -- invalid card:", card);
            return 1;
        }
        if (pos < 0 || pos > 3) {
            console.error("incomingTrickCard -- invalid position:", pos);
            return 1;
        }
        if (this.playedCards[pos] === card) return 0;
        if (this.playedCards[pos] !== '') {
            console.error("incomingTrickCard --", getPosName(pos), "already played", this.playedCards[pos], "this trick, got", card);
            if (!STANDALONE) socket.send(C2S.REQUEST_SYNC);
            return 1;
        }
        const expected = nextToPlay(this.playedCards, this.lastTrickWinner);
        if (expected !== pos) {
            console.error("incomingTrickCard -- expected", getPosName(expected), "to play, got", getPosName(pos));
            if (!STANDALONE) socket.send(C2S.REQUEST_SYNC);
            return 1;
        }

        this.playedCards[pos] = card;
        const ele = document.getElementById('playedCard' + getPosName(pos));
        ele.src = cardImageUrl(card);
        ele.className = `fake-card card-played card-played-${getPosName(pos).toLowerCase()} ${getSuitClass(cardStr2CardObj(card).s)}`;
        ele.style.display = "inline";
        store.commit('feedPush', `${names()[pos]} played ${card}${auto ? ' (auto)' : ''}.`);

        if (nextToPlay(this.playedCards, this.lastTrickWinner) === -1) {
            this.endTrick();
        } else {
            this.updateLegalHighlights();
        }
        return 0;
    }

    endTrick() {
        const winner = trickWinner(this.playedCards, this.lastTrickWinner, store.state.trumpSuit);
        this.predictedTrickWinner = winner;
        this.applyTrickWinner(winner);
    }

    applyTrickWinner(winner) {
        this.lastTrickWinner = winner;
        this.wonTricks[winner] += 1;
        store.commit('feedPush', `${names()[winner]} won the trick.`);
        this.playedCards = ['', '', '', ''];
        this.clearPlayedCards();
        this.renderStacks();
        if (this.isHandOver()) {
            this.endHand();
        } else {
            this.updateLegalHighlights();
        }
    }

    reconcileTrickWinner(winner) {
        if (this.predictedTrickWinner === -1) {
            this.applyTrickWinner(winner);
            return;
        }
        if (winner === this.predictedTrickWinner) {
            this.predictedTrickWinner = -1;
            return;
        }
        console.warn("reconcileTrickWinner -- client predicted", this.predictedTrickWinner, "server says", winner, ". Believing server.");
        this.wonTricks[this.predictedTrickWinner] -= 1;
        this.wonTricks[winner] += 1;
        this.lastTrickWinner = winner;
        this.predictedTrickWinner = -1;
        this.renderStacks();
        this.updateLegalHighlights();
    }

    restoreTrick(playedCards, leader, wonTricks) {
        this.playedCards = playedCards.slice();
        this.lastTrickWinner = leader;
        this.wonTricks = wonTricks.slice();
        this.clearPlayedCards();
        playedCards.forEach((card, pos) => {
            if (!card) return;
            const ele = document.getElementById('playedCard' + getPosName(pos));
            ele.src = cardImageUrl(card);
            ele.style.display = "inline";
        });
        this.renderStacks();
        this.updateLegalHighlights();
    }

    clearPlayedCards() {
        Array.from(document.getElementsByClassName("card-played")).forEach((ele) => {
            ele.src = CARD_BACK_URL;
            ele.style.display = "none";
        });
    }

    renderStacks() {
        this.wonTricks.forEach((count, pos) => {
            const ele = document.getElementById('wonTricks' + getPosName(pos));
            ele.style.display = count > 0 ? "flex" : "none";
            ele.textContent = count;
        });
    }

    updateLegalHighlights() {
        const hand = store.getters.getHand();
        if (!hand) return;
        const myTurn = store.state.gameState === 5 && nextToPlay(this.playedCards, this.lastTrickWinner) === 0;
        hand.markLegal(myTurn ? legalPlays(store.getters.getSharedHandCards(), this.playedCards, this.lastTrickWinner, store.state.trumpSuit) : null);
    }

    botPlay(pos) {
        if (!STANDALONE || !this.mockHands) return 1;
        const legal = legalPlays(this.mockHands[pos], this.playedCards, this.lastTrickWinner, store.state.trumpSuit);
        const card = legal[Math.floor(Math.random() * legal.length)];
        this.mockHands[pos].splice(this.mockHands[pos].indexOf(card), 1);
        return this.incomingTrickCard(pos, card, false);
    }

    getFinishedTricks() {
        return this.wonTricks.reduce((sum, n) => sum + n, 0);
    }

    isHandOver() {
        return store.state.gameState === 5 && this.getFinishedTricks() === 10;
    }

    endHand() {
        const bb = store.getters.getBidBox();
        const bid = store.state.winningBid;
        const bidTeam = bb.winningBidTeam;
        const teamTricks = [this.wonTricks[0] + this.wonTricks[2], this.wonTricks[1] + this.wonTricks[3]];
        const { deltas, made } = scoreHand(bid, bidTeam, teamTricks);
        store.commit('addHandScore', deltas);
        store.commit('feedPush', `${bidTeam === 0 ? 'We' : 'They'} ${made ? 'made' : 'missed'} ${bid}. Score ${store.state.scores[0]} to ${store.state.scores[1]}.`);

        const winnerTeam = gameOutcome(store.state.scores, bidTeam, made);
        if (winnerTeam !== -1) {
            this.endGame(winnerTeam);
            return;
        }
        store.commit('advanceDealer');
        store.commit('setGameState', 0);
        if (STANDALONE) setTimeout(() => this.dealStandalone(), 800);
    }

    endGame(winnerTeam) {
        store.commit('setGameState', 6);
        store.getters.getHand()?.markLegal(null);
        this.sortableSubmitCards.option("disabled", true);
        store.commit('notify', winnerTeam === 0 ? "We win!" : "They win.");
        store.commit('feedPush', `Game over. ${winnerTeam === 0 ? 'We' : 'They'} win ${store.state.scores[0]} to ${store.state.scores[1]}.`);
    }
}

onMounted(() => {
    const gt = new GameTable();
    store.commit('setSharedGameTable', gt);
})
</script>

<style scoped>
.card-stack {
    width: 70px;
    height: 100px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
    will-change: transform;
    background-color: #3498db;
    color: white;
    font-weight: bold;
    font-size: 28px;
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
    transform: translate(-50%, -50%);
}

.discard-blind {
    top: 90%;
    left: 25%;
    transform: translate(-50%, -50%) rotate(0deg);
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

#submitCards {
    bottom: -40px;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 2px dashed #7f8c8d;
    padding: 10px;
    min-width: 70px;
    min-height: 100px;
}

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
</style>
