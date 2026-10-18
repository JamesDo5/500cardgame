<template>
    <div v-if="bigBid" class="bid-banner" id="finalBidDisplay" :class="{ contract: hasContract }">
        <div class="bid-caption">{{ caption }}</div>
        <div class="bid-big" :class="bigBid.colorClass">{{ bigBid.tricks }}<span class="bid-suit" :class="{ glyph: bigBid.glyph }">{{ bigBid.symbol }}</span><span class="bid-points-big">({{ bigBid.points }})</span></div>
        <div class="bid-sub">{{ bigBid.sub }}</div>
    </div>
    <button v-if="showToggle" class="bidtable-toggle" type="button" @click="toggle">Bid table</button>
    <div v-show="tableOpen" class="bid-readouts">
        <div v-for="(d, i) in displayBids" :key="i" class="bid-display" :class="[POS_CLASSES[i], { placed: d.placed }]" :id="POS_IDS[i]">
            <span class="bid-prefix">{{ i === 0 ? 'My bid:' : 'Bid:' }}</span>
            <span v-if="d.pass" class="bid-pass">Pass</span>
            <span v-else-if="d.tricks" class="bid-value" :class="d.colorClass">{{ d.tricks }}<span class="bid-suit">{{ d.symbol }}</span><small class="bid-points">({{ d.points }})</small></span>
            <span v-else class="bid-none">---</span>
        </div>
    </div>
    <div class="bidbox" id="bidbox">
        <span class="close-bidbox" id="closeBidBox" @click="hide">&times;</span>
        <div class="bid-grid">
            <div class="bid-corner"></div>
            <div v-for="col in COLUMNS" :key="col.suit" class="bid-head" :class="[col.cls, { 'trump-col': hasContract && col.suit === trumpSuit }]">{{ col.label }}</div>
            <template v-for="(tricks, row) in TRICK_ROWS" :key="tricks">
                <div class="bid-rowlabel">{{ tricks }}</div>
                <div v-for="(col, c) in COLUMNS" :key="col.suit" class="bid-cell" :class="cellClass(bidAt(row, c))">
                    <span v-if="bidderOf(bidAt(row, c)) !== -1" class="bid-badge">{{ badgeText(bidderOf(bidAt(row, c))) }}</span>
                    <button class="bid-amount-button" :value="bidAt(row, c)" :disabled="bidAt(row, c) <= highest || !myTurn" :class="{ selected: selected === bidAt(row, c) }" @click="select(bidAt(row, c))">{{ bidAt(row, c) }}</button>
                </div>
            </template>
        </div>
        <div class="bid-actions">
            <button class="bid-amount-button pass-button" type="button" id="passBidBtn" :class="{ selected: selected === PASS }" :disabled="!myTurn" @click="select(PASS)">Pass</button>
            <button class="bid-amount-button submit-bid-button" type="button" id="submitBidBtn" :disabled="selected === -1 || !myTurn" @click="submit">Submit</button>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useStore } from 'vuex'
import { mode } from '../config.js';
import { socket } from '../net/socket.js';
import { C2S } from '../net/messages.js';
import { teamOf, SUIT_SYMBOLS, suitColorClass } from '../game/cards.js';
import { PASS, MIN_BID, MAX_BID, isValidBid, trumpSuitForBid, neededTricks, nextToBid, isBiddingOver, highestBid, winningBidder } from '../game/rules.js';

const store = useStore()

const COLUMNS = [
    { suit: 's', label: '♠', cls: '' },
    { suit: 'c', label: '♣', cls: '' },
    { suit: 'd', label: '♦', cls: 'red' },
    { suit: 'h', label: '♥', cls: 'red' },
    { suit: 'n', label: 'NoTrmp', cls: 'small' },
];
const TRICK_ROWS = [6, 7, 8, 9, 10];
const bidAt = (row, col) => 40 + row * 100 + col * 20;

const selected = ref(-1);
const tableOpen = ref(false);
const highest = ref(PASS);
const myTurn = ref(false);
const highestBy = ref(-1);
const displayBids = ref([-1, -1, -1, -1].map(formatBid));
const placedBids = ref([-1, -1, -1, -1]);
const bidderOf = (bid) => placedBids.value.indexOf(bid);
const cellClass = (bid) => {
    const pos = bidderOf(bid);
    return { mine: pos === 0, partner: pos === 2, opponent: pos === 1 || pos === 3 };
};
const badgeText = (pos) => pos === 0 ? 'You' : pos === 2 ? 'Partner' : store.state.playerNames[pos];
const POS_CLASSES = ['bottom-bid', 'left-bid', 'top-bid', 'right-bid'];
const POS_IDS = ['bottomBid', 'leftBid', 'topBid', 'rightBid'];
const hasContract = computed(() => store.state.gameState >= 3 && store.state.gameState <= 5 && store.state.winningBid > 0);
const trumpSuit = computed(() => store.state.trumpSuit);
const showToggle = computed(() => store.state.gameState >= 1 && store.state.gameState <= 5);
const who = (pos) => pos < 0 ? '' : `${store.state.playerNames[pos]} (${teamOf(pos) === 0 ? 'us' : 'them'})`;
const caption = computed(() => hasContract.value ? 'Bid' : 'Highest bid');
const bigBid = computed(() => {
    const idle = store.state.gameState <= 0 || store.state.gameState === 6;
    const bid = hasContract.value ? store.state.winningBid : highest.value;
    const pos = hasContract.value ? bidderPos.value : highestBy.value;
    if (idle || bid <= PASS) return null;
    const suit = trumpSuitForBid(bid);
    return { tricks: neededTricks(bid), symbol: SUIT_SYMBOLS[suit], glyph: suit !== 'n', colorClass: suitColorClass(suit), points: bid, sub: pos < 0 ? '' : `by ${who(pos)}` };
});
const bidderPos = computed(() => store.getters.getBidBox()?.winningBidder ?? -1);

function formatBid(bid) {
    if (bid === -1) return { placed: false };
    if (bid === PASS) return { placed: true, pass: true };
    const suit = trumpSuitForBid(bid);
    return { placed: true, tricks: neededTricks(bid), symbol: SUIT_SYMBOLS[suit], colorClass: suitColorClass(suit), points: bid };
}

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
        tableOpen.value = true;
        this.updateBidDisplays();
    }

    hide() {
        document.getElementById("bidbox").style.display = "none";
        tableOpen.value = false;
    }

    toggle() {
        if (document.getElementById("bidbox").style.display === "inline") this.hide(); else this.show();
    }

    getHighestBid() {
        return highestBid(this.bids);
    }

    updateBidDisplays() {
        displayBids.value = this.bids.map(formatBid);
        placedBids.value = this.bids.slice();
        highest.value = Math.max(this.getHighestBid(), PASS);
        highestBy.value = winningBidder(this.bids);
        myTurn.value = !isBiddingOver(this.bids) && nextToBid(this.bids, store.state.dealer) === 0 && store.state.gameState === 1;
        if (myTurn.value && document.getElementById("bidbox")?.style.display !== "inline") this.show();
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
        if (!mode.standalone) socket.send(C2S.BID, { bid: myBid });
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
            if (!mode.standalone) socket.send(C2S.REQUEST_SYNC);
            return 1;
        }
        const expected = nextToBid(this.bids, store.state.dealer);
        if (expected !== pos) {
            console.error("incomingBid -- expected position", expected, "to bid, got", pos);
            if (!mode.standalone) socket.send(C2S.REQUEST_SYNC);
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
        const highlighted = selected.value;
        const usable = isValidBid(highlighted) && (highlighted === PASS || highlighted > this.getHighestBid());
        selected.value = usable ? highlighted : PASS;
        store.commit('notify', usable && highlighted !== PASS ? `Time's up, bid ${highlighted} for you.` : "Time's up, passed for you.");
        return this.submitBid();
    }

    botBid(pos) {
        if (!mode.standalone || pos === 0 || this.bids[pos] !== -1) return 1;
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
        setTimeout(() => this.hide(), 300);
        gt.setTurn(winner);
        if (mode.standalone && winner === 0) gt.incomingBlind(gt.mockBlind, true);
    }
}

const bidbox = new BidBox();
const select = (bid) => { selected.value = bid; };
const submit = () => bidbox.submitBid();
const hide = () => bidbox.hide();
const toggle = () => bidbox.toggle();

onMounted(() => {
    store.commit('setSharedBidBox', bidbox);
    bidbox.updateBidDisplays();
});
</script>

<style scoped>
.bidbox {
    display: none;
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--ivory);
    color: var(--ink);
    border: 3px solid var(--ink);
    box-shadow: 0 0 0 3px var(--gold), 0 12px 32px var(--shadow);
    padding: 18px;
    border-radius: 0;
    text-align: center;
    z-index: 9;
    box-sizing: border-box;
    width: 660px;
}

.close-bidbox {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
}

.bid-banner {
    position: absolute;
    top: 108px;
    right: 25px;
    color: var(--ivory);
    font-family: Arial, sans-serif;
    text-align: right;
    line-height: 1;
}
.bid-caption {
    font-size: 40px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
}
.bid-banner.contract .bid-caption {
    color: var(--gold);
}
.bid-big {
    font-size: 132px;
    font-weight: 800;
    margin-top: 4px;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
.bid-big .bid-suit.glyph {
    font-size: 1.2em;
    line-height: 0;
}
.bid-points-big {
    font-size: 24px;
    font-weight: normal;
    color: var(--ivory);
    margin-left: 10px;
    vertical-align: middle;
}
.bid-sub {
    font-size: 24px;
    margin-top: 10px;
    color: var(--ivory);
}
.suit-red {
    color: var(--card-red-bright);
}
.suit-black {
    color: var(--ivory);
}
.bidbox .suit-black {
    color: var(--ivory);
}
.bid-display .bid-value {
    font-weight: 800;
}
.bid-display .bid-suit {
    font-size: 0.9em;
}
.bid-display .bid-points {
    font-size: 0.45em;
    margin-left: 6px;
    color: var(--muted);
    font-weight: normal;
}
.bid-display.placed .bid-prefix, .bid-display.placed .bid-pass {
    color: var(--gold-bright);
}
.bid-prefix {
    font-size: 0.6em;
    margin-right: 10px;
}
.bidtable-toggle {
    position: absolute;
    top: 72px;
    left: 380px;
    padding: 10px 20px;
    font-size: 18px;
    font-weight: bold;
    color: var(--ink);
    background: var(--ivory);
    border: none;
    border-radius: 0;
    cursor: pointer;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
    z-index: 6;
}
.bidtable-toggle:hover {
    background: var(--gold);
}

.bid-readouts {
    display: contents;
}
.bid-display {
    position: absolute;
    font-size: 32px;
    line-height: 1.2;
    padding: 3px 14px;
    color: var(--ivory);
    background: rgba(8, 18, 12, 0.7);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    font-family: Arial, sans-serif;
    text-align: center;
    white-space: nowrap;
    z-index: 8;
}
.bottom-bid {
    top: 60px;
    right: 25px;
}
.left-bid {
    left: 200px;
    top: 482px;
    transform: translateX(-50%);
}
.top-bid {
    left: 1010px;
    top: 106px;
}
.right-bid {
    left: 1400px;
    top: 482px;
    transform: translateX(-50%);
}

.bid-grid {
    display: grid;
    grid-template-columns: 54px repeat(5, minmax(0, 1fr));
    grid-auto-rows: 64px;
    gap: 6px;
    align-items: stretch;
    justify-items: stretch;
}
.bid-grid > :nth-child(-n + 6) {
    height: 46px;
}
.bid-head, .bid-rowlabel, .bid-corner {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Arial, sans-serif;
    font-size: 40px;
    color: black;
}
.bid-head.red {
    color: red;
}
.bid-head.small {
    font-size: 18px;
    font-weight: bold;
}
.bid-rowlabel {
    font-size: 28px;
}
.bid-cell {
    display: flex;
    min-width: 0;
    position: relative;
}
.bid-cell.partner .bid-amount-button {
    outline: 4px solid #2ecc71;
    outline-offset: -4px;
}
.bid-cell.opponent .bid-amount-button {
    outline: 3px dashed #bdc3c7;
    outline-offset: -3px;
}
.bid-cell.mine .bid-amount-button {
    outline: 4px solid #3498db;
    outline-offset: -4px;
}
.bid-badge {
    position: absolute;
    top: -9px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 96%;
    box-sizing: border-box;
    padding: 1px 8px;
    font-family: Arial, sans-serif;
    font-size: 16px;
    font-weight: bold;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: #2ecc71;
    color: #2c3e50;
    pointer-events: none;
    z-index: 1;
}
.bid-cell.opponent .bid-badge {
    background: #bdc3c7;
}
.bid-cell.mine .bid-badge {
    background: #3498db;
    color: white;
}
:root[data-trump] .bid-head.trump-col {
    background: var(--gold);
    box-shadow: inset 0 0 0 2px var(--ink), 0 0 0 2px var(--gold-deep);
}

button.bid-amount-button {
    width: 100%;
    height: 100%;
    min-width: 0;
    padding: 0;
    font-size: 38px;
    line-height: 1;
    box-sizing: border-box;
    color: var(--ink);
    background: var(--ivory-2);
    border: 2px solid var(--ivory-3);
    cursor: pointer;
}
button.bid-amount-button:hover:not(:disabled) {
    background: var(--gold-bright);
    border-color: var(--gold);
}
button.bid-amount-button:disabled {
    color: var(--ink-soft);
    opacity: 0.45;
    cursor: default;
}
button.bid-amount-button.selected {
    outline: 3px solid var(--gold);
    outline-offset: -3px;
    background: var(--gold-bright);
}
.bid-actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
}
button.pass-button, button.submit-bid-button {
    flex: 1;
    height: 56px;
    font-size: 34px;
}

.portrait .bidbox {
    top: 640px;
    transform: translateX(-50%);
    width: 527px;
    padding: 14px;
}
.portrait .bid-grid {
    grid-template-columns: 44px repeat(5, minmax(0, 1fr));
    grid-auto-rows: 50px;
    gap: 5px;
}
.portrait .bid-grid > :nth-child(-n + 6) {
    height: 40px;
}
.portrait .bid-head {
    font-size: 36px;
}
.portrait .bid-head.small {
    font-size: 16px;
}
.portrait .bid-rowlabel {
    font-size: 26px;
}
.portrait button.bid-amount-button {
    font-size: 34px;
}
.portrait .bid-badge {
    font-size: 17px;
    top: -11px;
}
.portrait button.pass-button, .portrait button.submit-bid-button {
    font-size: 30px;
}
.portrait .bid-banner {
    top: 56px;
    right: 20px;
}
.portrait .bid-big {
    font-size: 100px;
}
.portrait .bidtable-toggle {
    top: 12px;
    left: auto;
    right: 12px;
    padding: 8px 16px;
    font-size: 14px;
}
.portrait .bid-display {
    font-size: 26px;
    padding: 2px 10px;
}
.portrait .left-bid {
    left: 90px;
    top: 596px;
}
.portrait .right-bid {
    left: 710px;
    top: 596px;
}
.portrait .top-bid {
    left: 400px;
    top: 262px;
    transform: translateX(-50%);
}
.portrait .bottom-bid {
    top: auto;
    right: auto;
    left: 110px;
    bottom: 612px;
    transform: translateX(-50%);
}
</style>
