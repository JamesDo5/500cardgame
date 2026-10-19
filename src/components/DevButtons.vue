<template>
    <div class="dev-button-container">
        <button class="dev-button" type="button" @click="deal">Deal</button>
        <button class="dev-button" type="button" @click="toggleBidBox">Toggle bid table</button>
        <button class="dev-button" type="button" @click="botBid">Bot bids</button>
        <button class="dev-button" type="button" @click="flipBlind">Flip blind</button>
        <button class="dev-button" type="button" @click="submitBlind">Submit blind</button>
        <button class="dev-button" type="button" @click="submitTrick">Submit card</button>
        <button class="dev-button" type="button" @click="botPlay">Bot plays</button>
        <button class="dev-button" type="button" :class="{ on: autoBots }" @click="toggleAutoBots">Auto bots: {{ autoBots ? 'on' : 'off' }}</button>
        <button class="dev-button" type="button" :class="{ on: timersEnabled }" @click="toggleTimers">Timers: {{ timersEnabled ? 'on' : 'off' }}</button>
        <button class="dev-button" type="button" @click="nearGameOver">Near game over</button>
        <button class="dev-button" type="button" @click="fakeReview">Fake review</button>
        <button class="dev-button" type="button" @click="newGame">New game</button>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex'
import { nextToBid, nextToPlay, isBiddingOver } from '../game/rules.js';
import { buildDeck, shuffle } from '../game/cards.js';
import { MOVE_GRADES } from '../net/messages.js';

const store = useStore();
const gt = () => store.getters.getGameTable();
const bb = () => store.getters.getBidBox();
const autoBots = computed(() => store.state.autoBots);
const timersEnabled = computed(() => store.state.timersEnabled);

function startDevButtons() {
    store.commit('setPlayerName', { pos: 0, name: 'Me' });
    store.commit('setPlayerName', { pos: 1, name: 'LeftBot' });
    store.commit('setPlayerName', { pos: 2, name: 'Partner' });
    store.commit('setPlayerName', { pos: 3, name: 'RightBot' });
    gt().dealStandalone();
}

function deal() {
    gt().dealStandalone();
}

function toggleBidBox() {
    bb().toggle();
}

function botBid() {
    const box = bb();
    if (store.state.gameState !== 1 || isBiddingOver(box.bids)) {
        store.commit('notify', "Not in bidding.");
        return;
    }
    const nextBidder = nextToBid(box.bids, store.state.dealer);
    if (nextBidder === 0) {
        store.commit('notify', "It's your bid.");
        return;
    }
    box.botBid(nextBidder);
}

function flipBlind() {
    gt().flipBlind();
}

function submitBlind() {
    gt().submitBlind();
}

function submitTrick() {
    gt().submitTrick();
}

function botPlay() {
    const table = gt();
    if (store.state.gameState !== 5) {
        store.commit('notify', "Not in trick play.");
        return;
    }
    const next = nextToPlay(table.playedCards, table.lastTrickWinner);
    if (next === 0) {
        store.commit('notify', "It's your play.");
        return;
    }
    table.botPlay(next);
}

function toggleAutoBots() {
    store.commit('setAutoBots', !store.state.autoBots);
}

function toggleTimers() {
    store.commit('setTimersEnabled', !store.state.timersEnabled);
    if (!store.state.timersEnabled && store.state.turn.pos === 0) store.commit('setTurn', { pos: 0, deadlineMs: 0 });
}

function newGame() {
    gt().newGame();
}

function nearGameOver() {
    store.commit('setScores', { scores: [460, 440], handScores: [[460, 440]] });
}

function fakeReview() {
    const deck = shuffle(buildDeck());
    const moves = [0, 1, 2, 3].map(p => Array.from({ length: 10 }, (_, i) => {
        const card = deck[p * 10 + i];
        const grade = MOVE_GRADES[(i + p) % MOVE_GRADES.length];
        return { card, grade, best: grade === 'best' || grade === 'only' ? card : deck[40 + (i % 5)] };
    }));
    const bids = [{ bid: 100, grade: 'close', suggested: 140 }, { bid: 0, grade: 'best', suggested: 0 }, { bid: 0, grade: 'blunder', suggested: 60 }, { bid: 120, grade: 'gamble', suggested: 0 }];
    if (store.state.gameState !== 0) {
        bb().hide();
        store.commit('setGameState', 0);
        gt().setTurn(-1);
    }
    store.commit('setHandReview', { moves, scores: [72, 61, 80, 55], bids });
}

defineExpose({ startDevButtons })
</script>

<style scoped>
.dev-button-container {
    position: absolute;
    top: 0px;
    left: 0%;
    z-index: 100;
}

.dev-button.on {
    background-color: #2ecc71;
}
.dev-button {
    position: relative;
    width: 80px;
    height: 50px;
    padding: 6px 2px;
    font-size: 11px;
}

.portrait .dev-button {
    width: 64px;
    height: 30px;
    font-size: 9px;
    padding: 2px;
}
</style>
