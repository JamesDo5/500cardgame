<template>
    <div class="standing-bid-display" id="finalBidDisplay" :class="{ contract: hasContract }">{{ standingLabel }}</div>
    <div class="bidbox" id="bidbox">
        <div class="bottom-bid my-bid bid-display" id="bottomBid">My Bid: ---</div>
        <div class="left-bid other-bid bid-display" id="leftBid">Bid:<br />---</div>
        <div class="top-bid other-bid bid-display" id="topBid">Bid: ---</div>
        <div class="right-bid other-bid bid-display" id="rightBid">Bid:<br />---</div>
        <span class="close-bidbox" id="closeBidBox" @click="hide">&times;</span>
        <table>
            <tbody>
                <tr>
                    <th></th>
                    <th v-for="col in COLUMNS" :key="col.suit" :style="col.style">{{ col.label }}</th>
                </tr>
                <tr v-for="(tricks, row) in TRICK_ROWS" :key="tricks">
                    <td style="font-size:24px">{{ tricks }}</td>
                    <td v-for="(col, c) in COLUMNS" :key="col.suit">
                        <button class="bid-amount-button" :value="bidAt(row, c)" :disabled="bidAt(row, c) <= highest || !myTurn" :class="{ selected: selected === bidAt(row, c) }" @click="select(bidAt(row, c))">{{ bidAt(row, c) }}</button>
                    </td>
                </tr>
            </tbody>
        </table>
        <button class="bid-amount-button pass-button" type="button" id="passBidBtn" :class="{ selected: selected === PASS }" :disabled="!myTurn" @click="select(PASS)">Pass</button>
        <button class="bid-amount-button submit-bid-button" type="button" id="submitBidBtn" :disabled="selected === -1 || !myTurn" @click="submit">Submit</button>
    </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useStore } from 'vuex'
import { STANDALONE } from '../config.js';
import { socket } from '../net/socket.js';
import { C2S } from '../net/messages.js';
import { teamOf, SUIT_SYMBOLS } from '../game/cards.js';
import { PASS, MIN_BID, MAX_BID, isValidBid, trumpSuitForBid, neededTricks, nextToBid, isBiddingOver, highestBid, winningBidder } from '../game/rules.js';

const store = useStore()

const COLUMNS = [
    { suit: 's', label: '♠', style: 'font-size:32px' },
    { suit: 'c', label: '♣', style: 'font-size:32px' },
    { suit: 'd', label: '♦', style: 'color:red;font-size:32px' },
    { suit: 'h', label: '♥', style: 'color:red;font-size:32px' },
    { suit: 'n', label: 'NoTrmp', style: 'font-size:16px' },
];
const TRICK_ROWS = [6, 7, 8, 9, 10];
const bidAt = (row, col) => 40 + row * 100 + col * 20;

const selected = ref(-1);
const highest = ref(PASS);
const myTurn = ref(false);
const highestBy = ref(-1);
const hasContract = computed(() => store.state.gameState >= 3 && store.state.gameState <= 5 && store.state.winningBid > 0);
const standingLabel = computed(() => {
    const who = (pos) => `${store.state.playerNames[pos]} (${teamOf(pos) === 0 ? 'us' : 'them'})`;
    if (hasContract.value) {
        const bid = store.state.winningBid;
        return `Contract: ${neededTricks(bid)}${SUIT_SYMBOLS[store.state.trumpSuit] ?? ''} for ${bid} by ${who(bidderPos.value)}`;
    }
    if (store.state.gameState <= 0 || store.state.gameState === 6) return 'Standing bid: ---';
    if (highest.value > PASS) return `Standing bid: ${highest.value} by ${who(highestBy.value)}`;
    return 'Standing bid: ---';
});
const bidderPos = computed(() => store.getters.getBidBox()?.winningBidder ?? -1);

const names = () => store.state.playerNames;

class BidBox {
    constructor() {
        this.bids = [-1, -1, -1, -1];
        this.winningBidder = -1;
        this.winningBidTeam = -1;
    }

    reset() {
        this.bids = [-1, -1, -1, -1];
        this.winningBidder = -1;
        this.winningBidTeam = -1;
        selected.value = -1;
        this.updateBidDisplays();
    }

    show() {
        document.getElementById("bidbox").style.display = "inline";
        document.getElementById("submitCards").style.display = "none";
        this.updateBidDisplays();
    }

    hide() {
        document.getElementById("bidbox").style.display = "none";
        document.getElementById("submitCards").style.display = "flex";
    }

    toggle() {
        if (document.getElementById("bidbox").style.display === "inline") this.hide(); else this.show();
    }

    getHighestBid() {
        return highestBid(this.bids);
    }

    updateBidDisplays() {
        const index2PosName = ["bottom", "left", "top", "right"];
        const prefixes = ["My Bid: ", "Bid:<br />", "Bid: ", "Bid:<br />"];
        this.bids.forEach((bid, pos) => {
            const label = bid === -1 ? '---' : bid === PASS ? 'Pass' : bid;
            const ele = document.getElementById(index2PosName[pos] + "Bid");
            ele.innerHTML = prefixes[pos] + label;
            ele.style.color = bid === -1 ? "white" : "lightgreen";
        });
        highest.value = Math.max(this.getHighestBid(), PASS);
        highestBy.value = winningBidder(this.bids);
        myTurn.value = !isBiddingOver(this.bids) && nextToBid(this.bids, store.state.dealer) === 0 && store.state.gameState === 1;
        return 0;
    }

    submitBid() {
        const myBid = selected.value;
        if (!isValidBid(myBid)) {
            store.commit('notify', "Pick a bid or pass first.");
            return 1;
        }
        if (this.bids[0] !== -1) {
            store.commit('notify', "You already bid.");
            return 1;
        }
        if (nextToBid(this.bids, store.state.dealer) !== 0) {
            store.commit('notify', "It's not your turn to bid.");
            return 1;
        }
        if (myBid !== PASS && myBid <= this.getHighestBid()) {
            store.commit('notify', "Bid must beat the standing bid.");
            return 1;
        }
        store.commit('setGameState', 2);
        this.incomingBid(0, myBid);
        if (!STANDALONE) socket.send(C2S.BID, { bid: myBid });
        return 0;
    }

    incomingBid(pos, bid) {
        if (pos < 0 || pos > 3) {
            console.error("incomingBid -- invalid position:", pos);
            return 1;
        }
        if (!isValidBid(bid)) {
            console.error("incomingBid -- invalid bid:", bid);
            return 1;
        }
        if (this.bids[pos] === bid) return 0;
        if (this.bids[pos] !== -1) {
            console.error("incomingBid -- position", pos, "already bid", this.bids[pos], "got", bid);
            if (!STANDALONE) socket.send(C2S.REQUEST_SYNC);
            return 1;
        }
        const expected = nextToBid(this.bids, store.state.dealer);
        if (expected !== pos) {
            console.error("incomingBid -- expected position", expected, "to bid, got", pos);
            if (!STANDALONE) socket.send(C2S.REQUEST_SYNC);
            return 1;
        }
        if (bid !== PASS && bid <= this.getHighestBid()) {
            console.error("incomingBid -- bid", bid, "does not beat", this.getHighestBid());
            return 1;
        }

        this.bids[pos] = bid;
        store.commit('feedPush', `${names()[pos]} ${bid === PASS ? 'passed' : 'bid ' + bid}.`);
        this.updateBidDisplays();
        if (isBiddingOver(this.bids)) {
            this.endBidding();
        } else {
            store.getters.getGameTable().setTurn(nextToBid(this.bids, store.state.dealer));
        }
        return 0;
    }

    autoBid() {
        if (this.bids[0] !== -1) return 1;
        selected.value = PASS;
        store.commit('notify', "Time's up, passed for you.");
        return this.submitBid();
    }

    botBid(pos) {
        if (!STANDALONE || pos === 0 || this.bids[pos] !== -1) return 1;
        const floor = Math.max(this.getHighestBid(), MIN_BID - 20);
        if (floor === MAX_BID || Math.random() < 0.5) return this.incomingBid(pos, PASS);
        const options = Array.from({ length: Math.min(4, (MAX_BID - floor) / 20) }, (_, i) => floor + 20 * (i + 1));
        return this.incomingBid(pos, options[Math.floor(Math.random() * options.length)]);
    }

    endBidding() {
        const winner = winningBidder(this.bids);
        if (winner === -1) {
            this.applyBiddingResult({ redeal: true });
            return;
        }
        const bid = this.getHighestBid();
        this.applyBiddingResult({ winner, bid, trump: trumpSuitForBid(bid) });
    }

    incomingBiddingResult(result) {
        const same = result.redeal
            ? this.winningBidder === -1 && isBiddingOver(this.bids)
            : result.winner === this.winningBidder && result.bid === store.state.winningBid && result.trump === store.state.trumpSuit;
        if (same) return;
        console.warn("incomingBiddingResult -- server result", result, "differs from client. Believing server.");
        this.applyBiddingResult(result);
    }

    applyBiddingResult({ redeal, winner, bid, trump }) {
        const gt = store.getters.getGameTable();
        if (redeal) {
            store.commit('notify', "Everyone passed. Redealing.");
            store.commit('feedPush', "Everyone passed. Same dealer redeals.");
            store.commit('setGameState', 0);
            this.hide();
            gt.setTurn(store.state.dealer);
            return;
        }
        this.winningBidder = winner;
        this.winningBidTeam = teamOf(winner);
        highestBy.value = winner;
        store.commit('setTrumpSuit', trump);
        store.commit('setWinningBid', bid);
        store.commit('setGameState', 3);
        gt.lastTrickWinner = winner;
        store.commit('feedPush', `${names()[winner]} won the bid at ${bid} (${trump === 'n' ? 'no trump' : trump}).`);
        setTimeout(() => this.hide(), 1200);
        gt.setTurn(winner);
        if (STANDALONE && winner === 0) gt.incomingBlind(gt.mockBlind, true);
    }
}

const bidbox = new BidBox();
const select = (bid) => { selected.value = bid; };
const submit = () => bidbox.submitBid();
const hide = () => bidbox.hide();

onMounted(() => {
    store.commit('setSharedBidBox', bidbox);
    bidbox.updateBidDisplays();
});
</script>

<style scoped>
.bidbox {
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
    z-index: 9;
}

.close-bidbox {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
}

.standing-bid-display {
    position: absolute;
    top: 75px;
    right: 25px;
    font-size: 24px;
    color: white;
    font-family: Arial, sans-serif;
    text-align: right;
}
.standing-bid-display.contract {
    color: #f1c40f;
}

.bid-display {
    position: absolute;
    transform: translate(-50%, 50%);
    font-size: 32px;
    color: white;
}
.bottom-bid {
    bottom: -60px;
    left: 50%;
}
.left-bid {
    left: -100px;
    bottom: 50%;
}
.top-bid {
    top: -90px;
    left: 50%;
}
.right-bid {
    right: -160px;
    bottom: 50%;
}

table {
    border-collapse: collapse;
    margin: 0 auto;
}

button.bid-amount-button {
    width: 70px;
    height: 50px;
    font-size: 32px;
    min-width: fit-content;
}
button.bid-amount-button.selected {
    outline: 3px solid #2ecc71;
}
button.pass-button, button.submit-bid-button {
    margin-top: 10px;
    width: 45%;
}
</style>
