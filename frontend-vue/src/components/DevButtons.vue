<template>
    <div class="dev-button-container">
        <button class="dev-button" type="button" @click="deal">Deal</button>
        <button class="dev-button" type="button" @click="toggleBidBox">Toggle bid table</button>
        <button class="dev-button" type="button" @click="botBid">Bot bids</button>
        <button class="dev-button" type="button" @click="flipBlind">Flip blind</button>
        <button class="dev-button" type="button" @click="submitBlind">Submit blind</button>
        <button class="dev-button" type="button" @click="submitTrick">Submit card</button>
        <button class="dev-button" type="button" @click="botPlay">Bot plays</button>
        <button class="dev-button" type="button" @click="botAll">Bots play out</button>
        <button class="dev-button" type="button" @click="nearGameOver">Near game over</button>
    </div>
</template>

<script setup>
import { useStore } from 'vuex'
import { PASS, nextToBid, nextToPlay, isBiddingOver } from '../game/rules.js';

const store = useStore();
const gt = () => store.getters.getGameTable();
const bb = () => store.getters.getBidBox();

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
    const highest = Math.max(box.getHighestBid(), PASS);
    if (highest === 520 || Math.random() < 0.5) {
        box.incomingBid(nextBidder, PASS);
        return;
    }
    const options = Array.from({ length: (520 - highest) / 20 }, (_, i) => highest + 20 * (i + 1));
    const weighted = options.slice(0, Math.min(options.length, 4));
    box.incomingBid(nextBidder, weighted[Math.floor(Math.random() * weighted.length)]);
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

function botAll() {
    const table = gt();
    if (store.state.gameState !== 5) return;
    const next = nextToPlay(table.playedCards, table.lastTrickWinner);
    if (next === 0 || next === -1) return;
    table.botPlay(next);
    setTimeout(botAll, 250);
}

function nearGameOver() {
    store.commit('setScores', { scores: [460, 440], handScores: [[460, 440]] });
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

.dev-button {
    position: relative;
    width: 80px;
    height: 50px;
    padding: 6px 2px;
    font-size: 11px;
}
</style>
