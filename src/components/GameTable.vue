<template>
    <div id="gameTableContainer">
        <div id="gameTable">
            <img class="fake-card card-played card-played-left" id="playedCardLeft" draggable="false" :src="backUrl">
            <img class="fake-card card-played card-played-top" id="playedCardTop" draggable="false" :src="backUrl">
            <img class="fake-card card-played card-played-right" id="playedCardRight" draggable="false" :src="backUrl">
            <img class="fake-card card-played card-played-bottom" id="playedCardBottom" draggable="false" :src="backUrl">
            <div v-if="jokerBadge" class="joker-badge" :class="[jokerBadge.posClass, jokerBadge.colorClass]">{{ jokerBadge.symbol }}</div>
            <div class="card-row" id="submitCards" :class="{ parked: !showPlayButton }"></div>
            <div v-if="suitChooserOpen" class="suit-chooser">
                <div class="suit-chooser-label">Joker leads as</div>
                <button v-for="s in NOMINATABLE_SUITS" :key="s" class="suit-option" :class="[suitColorClass(s), { chosen: chosenSuit === s }]" type="button" :aria-pressed="chosenSuit === s" @click="chosenSuit = s">{{ SUIT_SYMBOLS[s] }}</button>
            </div>
            <button v-if="showPlayButton" class="table-button play-button" :class="{ armed: playArmed }" type="button" :disabled="!myPlayTurn || suitNeeded" @click="playNow">{{ suitNeeded ? 'Pick a suit' : playArmed ? 'Play card?' : 'Play card' }}</button>
            <button v-if="showBlindButton" class="table-button blind-button" type="button" :disabled="blindFaceDown" :title="blindFaceDown ? 'Flip the blind first' : ''" @click="submitBlindNow">{{ blindFaceDown ? 'Flip the blind first' : 'Submit blind' }}</button>
            <div class="card-stack won-tricks-bottom" id="wonTricksBottom"></div>
            <div class="card-stack won-tricks-left" id="wonTricksLeft"></div>
            <div class="card-stack won-tricks-top" id="wonTricksTop"></div>
            <div class="card-stack won-tricks-right" id="wonTricksRight"></div>
            <div class="card-stack discard-blind" id="blindDiscard"></div>
            <div v-if="showBlindStack" class="blind-stack">
                <img v-for="n in 5" :key="n" class="fake-card card-back blind-stack-card" :src="CARD_BACK_URL">
            </div>
            <div v-if="dealing" class="shuffle">
                <img v-for="n in 7" :key="n" class="fake-card card-back shuffle-card" draggable="false" :style="{ animationDelay: `${(n - 1) * 0.12}s` }" :src="backUrl">
            </div>
            <Transition name="caption-fade">
                <div v-if="boardCaption" class="board-caption" :class="captionClass">{{ boardCaption }}</div>
            </Transition>
            <button v-if="dealing && iAmDealer" class="deal-button" type="button" @click="dealNow">Deal</button>
        </div>
        <div class="card-row" id="blindCards"></div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, computed, ref, toRaw, watch } from 'vue';
import { useStore } from 'vuex'
import Sortable from 'sortablejs';
import { mode, TURN_TIMEOUT_MS, BID_TIMEOUT_MS, BLIND_TIMEOUT_MS, DEAL_TIMEOUT_MS, TABLE_WIDTH, AUTOPLAY_MARGIN_MS, BOT_DELAY_MS, TRICK_HOLD_MS, CARD_FLY_MS, TRICK_SWEEP_MS, paceMultiplier } from '../config.js';
import { socket } from '../net/socket.js';
import { C2S } from '../net/messages.js';
import { CARD_BACK_URL, cardBackUrl, HIDDEN_CARD, JOKER, SUITS, SUIT_SYMBOLS, suitColorClass, cardImageUrl, cardStr2CardObj, elem2CardStr, getPosName, getSuitClass, isValidCardStr, produceCardHtml, preloadCardImages, dealMock, teamOf } from '../game/cards.js';
import { NO_TRUMP, trickWinner, trickWinnerWithout, legalPlays, lowestCards, nextToPlay, nextToBid, scoreHand, gameOutcome, nominatesSuit, isNominatableSuit, longestSuit } from '../game/rules.js';
import { activeTrump } from '../theme.js';

const store = useStore()

const names = () => store.state.playerNames;
const backUrl = computed(() => cardBackUrl(activeTrump(store.state)));
const dealing = computed(() => store.state.gameState === 0);
const iAmDealer = computed(() => store.state.dealer === 0);
const showPlayButton = computed(() => store.state.gameState === 5);
const showBlindStack = computed(() => store.state.gameState === 1 || store.state.gameState === 2);
const myPlayTurn = computed(() => store.state.gameState === 5 && store.state.turn.pos === 0);
const leading = computed(() => store.state.trickCards.every(c => !c));
const NOMINATABLE_SUITS = SUITS;
const chosenSuit = ref('');
const suitChooserOpen = computed(() => myPlayTurn.value && leading.value && store.state.trumpSuit === NO_TRUMP && store.state.stagedCards.includes(JOKER));
const suitNeeded = computed(() => suitChooserOpen.value && !chosenSuit.value);
watch(suitChooserOpen, (open) => { if (!open) chosenSuit.value = ''; });
const BADGE_POS_CLASSES = ['badge-bottom', 'badge-left', 'badge-top', 'badge-right'];
const jokerBadge = computed(() => {
    const suit = store.state.jokerSuit;
    const pos = store.state.trickCards.indexOf(JOKER);
    if (!isNominatableSuit(suit) || pos === -1) return null;
    return { posClass: BADGE_POS_CLASSES[pos], colorClass: suitColorClass(suit), symbol: SUIT_SYMBOLS[suit] };
});
const myAction = computed(() => dealing.value ? iAmDealer.value : store.state.turn.pos === 0);
const boardCaption = computed(() => {
    const gs = store.state.gameState;
    const pos = store.state.turn.pos;
    if (gs === 0) return iAmDealer.value ? 'Your deal' : `${names()[store.state.dealer]} is dealing`;
    if (pos < 0) return '';
    const name = names()[pos];
    if (gs === 1 || gs === 2) return pos === 0 ? 'Your bid' : `${name} is bidding`;
    if (gs === 3) return pos === 0 ? 'Your blind' : `${name} is exchanging the blind`;
    if (gs === 4) return pos === 0 ? '' : `${name} is exchanging the blind`;
    if (gs === 5) {
        if (leading.value) return pos === 0 ? 'Your lead' : `${name} is leading`;
        return pos === 0 ? 'Your turn' : '';
    }
    return '';
});
const captionClass = computed(() => {
    const gs = store.state.gameState;
    return {
        mine: myAction.value,
        lead: gs === 5 && leading.value,
        corner: gs === 1 || gs === 2,
        low: gs === 3 || gs === 4,
    };
});
const playArmed = computed(() => myPlayTurn.value && store.state.stagedCards.length > 0);
const showBlindButton = computed(() => store.state.gameState === 3 && store.getters.getBidBox()?.winningBidder === 0 && store.state.turn.pos === 0);
const blindFaceDown = computed(() => store.state.blindFaceDown);
function playNow() {
    store.getters.getGameTable().submitTrick();
}
function submitBlindNow() {
    store.getters.getGameTable().submitBlind();
}
function dealNow() {
    const gt = store.getters.getGameTable();
    if (mode.standalone) gt.dealStandalone(); else socket.send(C2S.DEAL);
}

const PARTNER_JOKES = [
    "Partner: \"I had that the whole time.\"",
    "Partner: \"You're welcome.\"",
    "Partner: \"Don't worry, I'll carry us.\"",
    "Partner: \"That one was looking rough.\"",
    "Partner: \"Teamwork. Mostly me, but teamwork.\"",
    "Partner: \"I saw that coming three tricks ago.\"",
];
const SOURCE_ELEMENT_IDS = ['submitCards', 'leftCards', 'topCards', 'rightCards'];

class GameTable {
    constructor() {
        this.blindCards = [];
        this.submitCards = [];
        this.playedCards = ['', '', '', ''];
        this.playedThisHand = new Set();
        this.lastTrickWinner = -1;
        this.wonTricks = [0, 0, 0, 0];
        this.mockHands = null;
        this.mockBlind = null;
        this.sortableBlindCards = null;
        this.sortableSubmitCards = null;
        this.handledDeadline = 0;
        this.resolving = false;
        this.resolveTarget = -1;
        this.pendingCards = [];
        this.heldPlayCard = '';
        this.dropHeld = false;
        this.initializeSortables();
        this.ticker = setInterval(() => this.tickTurn(), 200);
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
            animation: 0,
            forceFallback: true,
        fallbackOnBody: true,
            fallbackOnBody: true,
            fallbackTolerance: 3,
            emptyInsertThreshold: 60,
            onStart: (evt) => evt.item.classList.remove('spun'),
            onAdd: (evt) => this.trackAdd(this.blindCards, evt.item, 'blind'),
            onRemove: (evt) => this.trackRemove(this.blindCards, evt.item, 'blind'),
            onChange: handOrNot,
            onEnd: (evt) => this.afterDragEnd(evt.item),
        });
        blindCardsElem.addEventListener("click", () => {
            const first = blindCardsElem.firstElementChild;
            if (first && first.classList.contains('card-back') && store.state.gameState === 3) this.flipBlind();
        });
        this.sortableSubmitCards = new Sortable(submitCardsElem, {
            disabled: true,
            group: 'shared',
            animation: 0,
            forceFallback: true,
        fallbackOnBody: true,
            fallbackOnBody: true,
            fallbackTolerance: 3,
            emptyInsertThreshold: 5,
            onStart: (evt) => evt.item.classList.remove('spun'),
            onAdd: (evt) => { this.trackAdd(this.submitCards, evt.item, 'submit'); this.syncStaged(); },
            onEnd: (evt) => { this.keepSingleStaged(evt.item); this.afterDragEnd(evt.item); },
            onRemove: (evt) => { this.trackRemove(this.submitCards, evt.item, 'submit'); this.syncStaged(); },
            onChange: handOrNot,
        });
        store.getters.getHand()?.onDragEnd?.((item) => { this.keepSingleStaged(item); this.afterDragEnd(item); });
        return 0;
    }

    trackAdd(arr, item, label) {
        if (this.dropHeld) return;
        const card = elem2CardStr(item);
        if (arr.includes(card)) {
            console.error(`onAdd ${label} -- card already present:`, card, arr);
            return;
        }
        arr.push(card);
        this.unHandify(item);
    }

    trackRemove(arr, item, label) {
        if (this.dropHeld) return;
        const ind = arr.indexOf(elem2CardStr(item));
        if (ind === -1) {
            console.error(`onRemove ${label} -- card not tracked:`, elem2CardStr(item), arr);
            return;
        }
        arr.splice(ind, 1);
    }

    syncStaged() {
        store.commit('setStagedCards', this.submitCards);
    }

    legal(hand) {
        return legalPlays(hand, this.playedCards, this.lastTrickWinner, store.state.trumpSuit, store.state.jokerSuit);
    }

    nominationFor(card, hand) {
        if (!nominatesSuit(card, this.playedCards, this.lastTrickWinner, store.state.trumpSuit)) return '';
        return isNominatableSuit(chosenSuit.value) ? chosenSuit.value : longestSuit(hand);
    }

    sendPlay(card, suit) {
        if (mode.standalone) return;
        socket.send(C2S.PLAY_CARD, suit ? { card, suit } : { card });
    }

    syncPlayed() {
        store.commit('setTrickCards', this.playedCards);
    }

    afterDragEnd(item) {
        if (this.dropHeld) {
            this.dropHeld = false;
            item.remove();
            this.syncStaged();
            this.updateLegalHighlights();
            return;
        }
        if (!this.heldPlayCard || elem2CardStr(item) !== this.heldPlayCard) return;
        const card = this.heldPlayCard;
        this.heldPlayCard = '';
        item.remove();
        store.commit('setSharedHandCards', store.getters.getSharedHandCards().filter(c => c !== card));
        this.submitCards = this.submitCards.filter(c => c !== card);
        this.blindCards = this.blindCards.filter(c => c !== card);
        this.syncStaged();
        this.updateLegalHighlights();
    }

    keepSingleStaged(newItem) {
        const submitBox = document.getElementById('submitCards');
        if (newItem.parentElement !== submitBox || submitBox.children.length < 2) return;
        const handBox = document.getElementById('bottomCards');
        Array.from(submitBox.children).filter(ele => ele !== newItem).forEach(ele => {
            const card = elem2CardStr(ele);
            const ind = this.submitCards.indexOf(card);
            if (ind !== -1) this.submitCards.splice(ind, 1);
            handBox.appendChild(ele);
            store.getters.getHand().handifyCard(ele);
            const hcs = store.getters.getSharedHandCards();
            if (!hcs.includes(card)) store.commit('setSharedHandCards', hcs.concat(card));
        });
        this.updateLegalHighlights();
    }

    unHandify(item) {
        item.classList.add("real-card");
        item.classList.remove("bouncy", "hand-card", "spun", "illegal");
    }

    setTurn(pos) {
        if (pos === -1) {
            store.commit('setTurn', { pos: -1, deadlineMs: 0 });
            return;
        }
        const gs = store.state.gameState;
        const bot = mode.standalone && pos !== 0;
        if (bot && store.state.autoBots) {
            store.commit('setTurn', { pos, deadlineMs: Date.now() + BOT_DELAY_MS });
            return;
        }
        if (!store.state.timersEnabled) {
            store.commit('setTurn', { pos, deadlineMs: 0 });
            return;
        }
        const ms = gs === 0 ? DEAL_TIMEOUT_MS : gs === 1 || gs === 2 ? BID_TIMEOUT_MS : gs === 3 || gs === 4 ? BLIND_TIMEOUT_MS : TURN_TIMEOUT_MS;
        store.commit('setTurn', { pos, deadlineMs: Date.now() + ms * paceMultiplier(store.state.pace) });
    }

    expectedActor() {
        const gs = store.state.gameState;
        const bb = store.getters.getBidBox();
        if (gs === 0) return store.state.dealer;
        if (gs === 1 || gs === 2) return bb ? nextToBid(bb.bids, store.state.dealer) : -1;
        if (gs === 3 || gs === 4) return bb ? bb.winningBidder : -1;
        if (gs === 5) return this.resolving ? -1 : nextToPlay(this.playedCards, this.lastTrickWinner);
        return -1;
    }

    dispose() {
        clearInterval(this.ticker);
        this.sortableBlindCards?.destroy();
        this.sortableSubmitCards?.destroy();
    }

    tickTurn() {
        if (toRaw(store.state.gameTable) !== toRaw(this)) {
            this.dispose();
            return;
        }
        const { pos, deadlineMs } = store.state.turn;
        if (pos === -1) return;
        const expected = this.expectedActor();
        if (expected !== -1 && expected !== pos) {
            console.warn("tickTurn -- turn pointed at", getPosName(pos), "but", getPosName(expected), "must act. Correcting.");
            this.setTurn(expected);
            return;
        }
        if (deadlineMs === 0 || deadlineMs === this.handledDeadline) return;
        const now = Date.now();
        if (pos === 0 && now >= deadlineMs - AUTOPLAY_MARGIN_MS) {
            this.handledDeadline = deadlineMs;
            this.autoAct(0);
        } else if (pos !== 0 && mode.standalone && store.state.autoBots && now >= deadlineMs) {
            this.handledDeadline = deadlineMs;
            this.autoAct(pos);
        }
    }

    autoAct(pos) {
        const gs = store.state.gameState;
        const bb = store.getters.getBidBox();
        if (gs === 0) {
            if (mode.standalone) this.dealStandalone(); else this.setTurn(-1);
        } else if (gs === 1 || gs === 2) {
            if (pos === 0) bb.autoBid(); else bb.botBid(pos);
        } else if (gs === 3 || gs === 4) {
            if (pos === 0) this.autoBlind(); else this.botBlind(pos);
        } else if (gs === 5) {
            if (pos === 0) this.autoPlay(); else this.botPlay(pos);
        } else {
            this.setTurn(-1);
        }
    }

    newHand() {
        this.blindCards = [];
        this.submitCards = [];
        this.playedCards = ['', '', '', ''];
        this.playedThisHand = new Set();
        this.lastTrickWinner = -1;
        this.wonTricks = [0, 0, 0, 0];
        this.mockHands = null;
        this.mockBlind = null;
        this.resolving = false;
        this.resolveTarget = -1;
        this.pendingCards = [];
        store.commit('resetCardCounts');
        store.commit('setFirstCardPlayed', false);
        store.commit('setHandScored', false);
        this.heldPlayCard = '';
        document.getElementById('submitCards').innerHTML = "";
        this.syncStaged();
        document.getElementById('blindCards').innerHTML = "";
        document.getElementById('blindCards').style.display = "flex";
        document.getElementById('blindDiscard').style.display = "none";
        store.commit('setBlindFaceDown', false);
        this.sortableBlindCards.option("disabled", true);
        this.sortableSubmitCards.option("disabled", true);
        this.clearPlayedCards();
        this.syncPlayed();
        store.commit('setJokerSuit', '');
        this.renderStacks();
        store.commit('setTrumpSuit', '');
        store.commit('setWinningBid', -1);
        store.getters.getHand()?.markLegal(null);
    }

    startBidding() {
        store.commit('setGameState', 1);
        store.getters.getBidBox().show();
        this.setTurn(nextToBid(store.getters.getBidBox().bids, store.state.dealer));
    }

    dealStandalone() {
        if (!mode.standalone) return 1;
        const { hands, blind } = dealMock();
        this.newHand();
        this.mockHands = hands;
        this.mockBlind = blind;
        store.getters.getBidBox().reset();
        store.getters.getHand().incomingHandCards(hands[0]);
        store.commit('feedPush', `${names()[store.state.dealer]} dealt.`);
        this.startBidding();
        return 0;
    }

    incomingBlind(cards, faceDown) {
        if (!Array.isArray(cards) || cards.length !== 5 || !cards.every(isValidCardStr)) {
            console.error("incomingBlind() -- expected 5 valid cards:", cards);
            return 1;
        }
        this.blindCards = cards.slice();
        preloadCardImages(cards);
        this.renderBlind(faceDown);
        return 0;
    }

    renderBlind(faceDown) {
        const cardsElement = document.getElementById('blindCards');
        cardsElement.style.display = "flex";
        cardsElement.innerHTML = this.blindCards.map(card => produceCardHtml(card, faceDown, 'real-card', backUrl.value)).join('');
        this.setBlindFaceDown(faceDown);
    }

    setBlindFaceDown(faceDown) {
        store.commit('setBlindFaceDown', faceDown);
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
        const items = Array.from(blindElement.children);
        if (store.state.blindFaceDown || items.some(ele => ele.classList.contains('card-back'))) {
            store.commit('notify', "Flip the blind first.");
            this.setBlindFaceDown(true);
            return 1;
        }
        this.sortableBlindCards.option("disabled", true);
        if (items.length !== 5) {
            store.commit('notify', "Discard exactly 5 cards to the blind.");
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
        if (mode.standalone) {
            this.incomingBlindDiscard(0);
        } else {
            socket.send(C2S.SUBMIT_BLIND, { discards });
        }
        return 0;
    }

    autoBlind() {
        const inBox = this.blindCards.slice(0, 5);
        const overflow = this.blindCards.slice(5);
        const hand = store.getters.getSharedHandCards().concat(overflow);
        const fill = lowestCards(hand, 5 - inBox.length);
        const discards = inBox.concat(fill);
        const newHand = hand.filter(c => !fill.includes(c));
        if (discards.length !== 5 || newHand.length !== 10) {
            console.error("autoBlind -- could not form a 5 card discard and 10 card hand:", discards, newHand);
            this.setTurn(-1);
            return 1;
        }
        if (Sortable.dragged) this.dropHeld = true;
        store.getters.getHand().replaceHand(newHand);
        this.blindCards = discards;
        this.renderBlind(false);
        store.commit('notify', fill.length ? `Time's up, discarded ${discards.join(' ')} for you.` : "Time's up, blind submitted for you.");
        return this.submitBlind();
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
        const discard = document.getElementById('blindDiscard');
        discard.className = `card-stack discard-blind discard-blind-${getPosName(pos).toLowerCase()}`;
        discard.style.display = "flex";
        this.lastTrickWinner = pos;
        this.sortableSubmitCards.option("disabled", false);
        store.commit('setGameState', 5);
        store.commit('feedPush', `${names()[pos]} took the blind and leads.`);
        this.setTurn(pos);
        this.updateLegalHighlights();
        return 0;
    }

    botBlind(pos) {
        if (!mode.standalone || !this.mockHands) return 1;
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
        if (nextToPlay(this.playedCards, this.lastTrickWinner) !== 0) {
            store.commit('notify', "It's not your turn.");
            reenable();
            return 1;
        }
        if (submitBoxElement.children.length === 0) {
            const hand = store.getters.getSharedHandCards();
            const legalInHand = this.legal(hand);
            if (legalInHand.length !== 1) {
                store.commit('notify', hand.length ? "Drag a card to the play box first." : "No cards left.");
                reenable();
                return 1;
            }
            const only = legalInHand[0];
            const rest = hand.filter(c => c !== only);
            const suit = this.nominationFor(only, rest);
            document.querySelectorAll(`#bottomCards [data-card="${only}"]`).forEach(ele => ele.remove());
            store.commit('setSharedHandCards', rest);
            store.commit('setFirstCardPlayed', true);
            this.incomingTrickCard(0, only, false, suit);
            this.sendPlay(only, suit);
            reenable();
            return 0;
        }
        if (submitBoxElement.children.length !== 1) {
            store.commit('notify', "Put exactly one card in the play box.");
            reenable();
            return 1;
        }
        const card = elem2CardStr(submitBoxElement.firstElementChild);
        const legal = this.legal(store.getters.getSharedHandCards().concat(card));
        if (!legal.includes(card)) {
            store.commit('notify', "You must follow suit.");
            reenable();
            return 1;
        }
        if (nominatesSuit(card, this.playedCards, this.lastTrickWinner, store.state.trumpSuit) && !isNominatableSuit(chosenSuit.value)) {
            store.commit('notify', "Pick the suit the joker leads as.");
            reenable();
            return 1;
        }
        const suit = this.nominationFor(card, store.getters.getSharedHandCards());

        submitBoxElement.innerHTML = "";
        this.submitCards = [];
        this.syncStaged();
        store.commit('setFirstCardPlayed', true);
        this.incomingTrickCard(0, card, false, suit);
        this.sendPlay(card, suit);
        reenable();
        return 0;
    }

    autoPlay() {
        if (store.state.gameState !== 5 || nextToPlay(this.playedCards, this.lastTrickWinner) !== 0) return 1;
        const dragged = Sortable.dragged;
        const draggedCard = dragged ? elem2CardStr(dragged) : '';
        const boxed = this.submitCards.slice();
        const hand = store.getters.getSharedHandCards();
        const all = Array.from(new Set(hand.concat(boxed, draggedCard ? [draggedCard] : [])));
        const legal = this.legal(all);
        const card = boxed.find(c => legal.includes(c)) ?? (legal.includes(draggedCard) ? draggedCard : lowestCards(legal, 1)[0]);
        if (!card) {
            this.setTurn(-1);
            return 1;
        }
        if (card === draggedCard) {
            this.heldPlayCard = card;
        } else {
            document.querySelectorAll(`#submitCards [data-card="${card}"], #bottomCards [data-card="${card}"]`).forEach(ele => ele.remove());
        }
        const suit = this.nominationFor(card, all.filter(c => c !== card));
        store.commit('setSharedHandCards', hand.filter(c => c !== card));
        this.submitCards = boxed.filter(c => c !== card);
        this.syncStaged();
        store.commit('notify', card === draggedCard ? `Time's up, played the ${card} you were holding.` : `Time's up, played ${card} for you.`);
        store.commit('setFirstCardPlayed', true);
        this.incomingTrickCard(0, card, true, suit);
        this.sendPlay(card, suit);
        return 0;
    }

    incomingTrickCard(pos, card, auto = false, suit = '') {
        if (!isValidCardStr(card)) {
            console.error("incomingTrickCard -- invalid card:", card);
            return 1;
        }
        if (pos < 0 || pos > 3) {
            console.error("incomingTrickCard -- invalid position:", pos);
            return 1;
        }
        if (this.playedCards[pos] === card || this.playedThisHand.has(card)) return 0;
        if (this.resolving) {
            this.pendingCards.push([pos, card, auto, suit]);
            return 0;
        }
        if (this.playedCards[pos] !== '') {
            console.error("incomingTrickCard --", getPosName(pos), "already played", this.playedCards[pos], "this trick, got", card);
            if (!mode.standalone) socket.send(C2S.REQUEST_SYNC);
            return 1;
        }
        const expected = nextToPlay(this.playedCards, this.lastTrickWinner);
        if (expected !== pos) {
            console.error("incomingTrickCard -- expected", getPosName(expected), "to play, got", getPosName(pos));
            if (!mode.standalone) socket.send(C2S.REQUEST_SYNC);
            return 1;
        }

        const nominated = nominatesSuit(card, this.playedCards, this.lastTrickWinner, store.state.trumpSuit) && isNominatableSuit(suit) ? suit : '';
        this.playedCards[pos] = card;
        this.playedThisHand.add(card);
        this.syncPlayed();
        if (nominated) store.commit('setJokerSuit', nominated);
        store.commit('setCardCount', { pos, n: store.state.cardCounts[pos] - 1 });
        const ele = document.getElementById('playedCard' + getPosName(pos));
        ele.dataset.card = card;
        ele.src = cardImageUrl(card);
        ele.className = `fake-card card-played card-played-${getPosName(pos).toLowerCase()} ${getSuitClass(cardStr2CardObj(card).s)}`;
        ele.style.display = "inline";
        this.flyIn(ele, pos);
        store.commit('feedPush', `${names()[pos]} played ${card}${nominated ? ` as ${SUIT_SYMBOLS[nominated]}` : ''}${auto ? ' (auto)' : ''}.`);

        const next = nextToPlay(this.playedCards, this.lastTrickWinner);
        if (next === -1) {
            this.endTrick();
        } else {
            this.setTurn(next);
            this.updateLegalHighlights();
        }
        return 0;
    }

    tableLocal(rect) {
        const table = document.getElementById('gameTable').getBoundingClientRect();
        const scale = table.width / TABLE_WIDTH;
        return { x: (rect.left + rect.width / 2 - table.left) / scale, y: (rect.top + rect.height / 2 - table.top) / scale };
    }

    flyIn(ele, pos) {
        const source = document.getElementById(SOURCE_ELEMENT_IDS[pos]);
        if (!source || typeof ele.animate !== 'function') return;
        const from = this.tableLocal(source.getBoundingClientRect());
        const cs = getComputedStyle(ele);
        const startScale = pos === 0 ? 1.2 : 0.7;
        ele.animate(
            [{ left: `${from.x}px`, top: `${from.y}px`, transform: `${cs.transform} scale(${startScale})`, opacity: 0.6 }, { left: cs.left, top: cs.top, transform: cs.transform, opacity: 1 }],
            { duration: CARD_FLY_MS, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
    }

    endTrick() {
        this.resolveTrick(trickWinner(this.playedCards, this.lastTrickWinner, store.state.trumpSuit));
    }

    resolveTrick(winner) {
        this.resolving = true;
        this.resolveTarget = winner;
        this.setTurn(-1);
        store.getters.getHand()?.markLegal(null);
        setTimeout(() => this.sweepTrick(), TRICK_HOLD_MS);
    }

    sweepTrick() {
        const winner = this.resolveTarget;
        store.commit('setJokerSuit', '');
        const stack = document.getElementById('wonTricks' + getPosName(winner));
        const stackStyle = getComputedStyle(stack);
        const cards = Array.from(document.getElementsByClassName("card-played")).filter(ele => ele.style.display !== "none");
        const animations = cards.map((ele, i) => {
            if (typeof ele.animate !== 'function') return Promise.resolve();
            const cs = getComputedStyle(ele);
            const anim = ele.animate(
                [
                    { left: cs.left, top: cs.top, transform: cs.transform, opacity: 1 },
                    { left: stackStyle.left, top: stackStyle.top, transform: `${stackStyle.transform} scale(0.55)`, opacity: 0.2 },
                ],
                { duration: TRICK_SWEEP_MS, delay: i * 40, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }
            );
            return anim.finished.catch(() => {});
        });
        Promise.all(animations).then(() => {
            cards.forEach(ele => ele.getAnimations().forEach(a => a.cancel()));
            this.finishTrick(winner);
        });
    }

    finishTrick(winner) {
        const trick = this.playedCards.slice();
        const leader = this.lastTrickWinner;
        this.lastTrickWinner = winner;
        this.wonTricks[winner] += 1;
        store.commit('feedPush', `${names()[winner]} won the trick.`);
        this.maybePartnerJoke(trick, leader, winner);
        this.playedCards = ['', '', '', ''];
        this.syncPlayed();
        store.commit('setJokerSuit', '');
        this.clearPlayedCards();
        this.renderStacks();
        this.resolving = false;
        this.resolveTarget = -1;
        if (this.isHandOver()) {
            this.endHand();
            return;
        }
        this.setTurn(winner);
        this.updateLegalHighlights();
        const pending = this.pendingCards;
        this.pendingCards = [];
        pending.forEach(([pos, card, auto, suit]) => this.incomingTrickCard(pos, card, auto, suit));
    }

    maybePartnerJoke(trick, leader, winner) {
        if (winner !== 2 || !trick[0]) return;
        const withoutPartner = trickWinnerWithout(trick, leader, store.state.trumpSuit, 2);
        if (withoutPartner !== 1 && withoutPartner !== 3) return;
        const joke = PARTNER_JOKES[Math.floor(Math.random() * PARTNER_JOKES.length)];
        store.commit('notify', joke);
        store.commit('feedPush', joke);
    }

    reconcileTrickWinner(winner) {
        if (winner < 0 || winner > 3) return;
        if (this.resolving) {
            if (winner !== this.resolveTarget) {
                console.warn("reconcileTrickWinner -- client predicted", this.resolveTarget, "server says", winner, ". Believing server.");
                this.resolveTarget = winner;
            }
            return;
        }
        if (winner === this.lastTrickWinner) return;
        if (this.playedCards.some(Boolean) || this.getFinishedTricks() === 0) {
            console.error("reconcileTrickWinner -- server says", getPosName(winner), "won a trick the client has no record of. Resyncing.");
            if (!mode.standalone) socket.send(C2S.REQUEST_SYNC);
            return;
        }
        console.warn("reconcileTrickWinner -- client predicted", this.lastTrickWinner, "server says", winner, ". Believing server.");
        this.wonTricks[this.lastTrickWinner] -= 1;
        this.wonTricks[winner] += 1;
        this.lastTrickWinner = winner;
        this.renderStacks();
        this.setTurn(winner);
        this.updateLegalHighlights();
    }

    restoreTrick(playedCards, leader, wonTricks, jokerSuit = '') {
        this.playedCards = playedCards.slice();
        this.playedThisHand = new Set(playedCards.filter(Boolean));
        this.syncPlayed();
        store.commit('setJokerSuit', isNominatableSuit(jokerSuit) ? jokerSuit : '');
        this.lastTrickWinner = leader;
        this.wonTricks = wonTricks.slice();
        this.clearPlayedCards();
        playedCards.forEach((card, pos) => {
            if (!card) return;
            const ele = document.getElementById('playedCard' + getPosName(pos));
            ele.dataset.card = card;
            ele.src = cardImageUrl(card);
            ele.style.display = "inline";
        });
        this.renderStacks();
        this.updateLegalHighlights();
    }

    clearPlayedCards() {
        Array.from(document.getElementsByClassName("card-played")).forEach((ele) => {
            ele.dataset.card = HIDDEN_CARD;
            ele.src = backUrl.value;
            ele.style.display = "none";
        });
    }

    renderStacks() {
        this.wonTricks.forEach((count, pos) => {
            const ele = document.getElementById('wonTricks' + getPosName(pos));
            ele.style.visibility = count > 0 ? "visible" : "hidden";
            const cards = Array.from({ length: count }, (_, i) => `<img class="stack-card" src="${CARD_BACK_URL}" style="--i:${i}">`).join('');
            ele.innerHTML = `${cards}<span class="stack-count">${count}</span>`;
        });
    }

    updateLegalHighlights() {
        const hand = store.getters.getHand();
        if (!hand) return;
        const myTurn = store.state.gameState === 5 && nextToPlay(this.playedCards, this.lastTrickWinner) === 0;
        hand.markLegal(myTurn ? this.legal(store.getters.getSharedHandCards()) : null);
    }

    botPlay(pos) {
        if (!mode.standalone || !this.mockHands) return 1;
        const legal = this.legal(this.mockHands[pos]);
        const card = legal[Math.floor(Math.random() * legal.length)];
        this.mockHands[pos].splice(this.mockHands[pos].indexOf(card), 1);
        const suit = nominatesSuit(card, this.playedCards, this.lastTrickWinner, store.state.trumpSuit) ? longestSuit(this.mockHands[pos]) : '';
        return this.incomingTrickCard(pos, card, false, suit);
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

        store.commit('setCardCount', { pos: 0, n: 10 });
        const winnerTeam = gameOutcome(store.state.scores, bidTeam, made);
        if (winnerTeam !== -1) {
            this.endGame(winnerTeam);
            return;
        }
        store.commit('advanceDealer');
        store.commit('setGameState', 0);
        this.setTurn(store.state.dealer);
    }

    endGame(winnerTeam) {
        store.commit('setGameState', 6);
        store.commit('setGameWinner', winnerTeam);
        this.setTurn(-1);
        store.getters.getHand()?.markLegal(null);
        this.sortableSubmitCards.option("disabled", true);
        store.commit('notify', winnerTeam === 0 ? "We win!" : "They win.");
        store.commit('feedPush', `Game over. ${winnerTeam === 0 ? 'We' : 'They'} win ${store.state.scores[0]} to ${store.state.scores[1]}.`);
    }

    newGame() {
        store.commit('resetGame');
        store.commit('setGameState', 0);
        this.newHand();
        if (mode.standalone) this.dealStandalone();
    }
}

let instance = null;
onMounted(() => {
    instance = new GameTable();
    store.commit('setSharedGameTable', instance);
})
onBeforeUnmount(() => {
    instance?.dispose();
})
</script>

<style scoped>
.card-stack {
    width: 70px;
    height: 100px;
    border-radius: 0;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
    will-change: transform;
    background-color: var(--card-back);
    color: var(--ivory);
    border: 2px solid var(--ivory);
    box-sizing: border-box;
    font-weight: bold;
    font-size: 28px;
    position: absolute;
    display: flex;
    visibility: hidden;
}

.card-stack :deep(.stack-card) {
    position: absolute;
    left: 0;
    top: 0;
    width: 70px;
    height: 100px;
    --s: 1;
    transform: translate(calc(var(--i) * var(--s) * 2px), calc(var(--i) * -4px)) rotate(calc(var(--s) * 3deg));
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.45);
}
.card-stack :deep(.stack-card:nth-child(even)) {
    --s: -1;
}
.card-stack :deep(.stack-count) {
    position: relative;
    z-index: 1;
    min-width: 44px;
    padding: 0 10px;
    font-size: 54px;
    line-height: 1.15;
    background: rgba(44, 62, 80, 0.85);
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
}

.won-tricks-left :deep(.stack-count) {
    transform: rotate(-90deg);
}
.won-tricks-top :deep(.stack-count) {
    transform: rotate(180deg);
}
.won-tricks-right :deep(.stack-count) {
    transform: rotate(90deg);
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
    background-color: var(--felt-edge);
    opacity: 0.85;
    display: none;
    visibility: visible;
}
.discard-blind-bottom {
    top: 90%;
    left: 25%;
    transform: translate(-50%, -50%);
}
.discard-blind-left {
    top: 35%;
    left: 8%;
    transform: translate(-50%, -50%) rotate(90deg);
}
.discard-blind-top {
    top: 10%;
    left: 65%;
    transform: translate(-50%, -50%) rotate(180deg);
}
.discard-blind-right {
    top: 65%;
    left: 92%;
    transform: translate(-50%, -50%) rotate(270deg);
}

.card-played {
    position: absolute;
    display: none;
    width: 140px;
    height: 200px;
}

.card-played-left {
    top: 42%;
    left: 28%;
    transform: translate(-50%, -50%) rotate(90deg);
    z-index: 3;
}

.card-played-top {
    top: 22%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(180deg);
    z-index: 2;
}

.card-played-right {
    top: 42%;
    left: 72%;
    transform: translate(-50%, -50%) rotate(270deg);
    z-index: 1;
}

.card-played-bottom {
    top: 62%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 4;
}

#submitCards {
    top: 100%;
    left: 50%;
    transform: translate(-50%, -62%);
    z-index: 2;
    border: 3px dashed var(--gold);
    border-radius: 0;
    padding: 16px;
    min-width: 150px;
    min-height: 214px;
    justify-content: center;
    align-items: center;
    background-color: var(--felt-edge);
}
#submitCards:empty {
    background-color: rgba(0, 0, 0, 0.18);
}
#submitCards.parked {
    display: none;
}
#submitCards :deep(.real-card > *), #submitCards :deep(.hand-card > *) {
    width: 150px;
    height: 214px;
    display: block;
}

#blindCards :deep(.real-card > *), #blindCards :deep(.hand-card > *) {
    width: 150px;
    height: 214px;
    background-color: var(--ivory);
    border-radius: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
    will-change: transform;
}

#gameTableContainer {
    position: absolute;
    top: 130px;
    left: 50%;
    transform: translateX(-50%);
    width: 1000px;
    height: 560px;
    display: flex;
    justify-content: center;
    align-items: center;
}

#gameTable {
    width: 800px;
    height: 560px;
    background-color: var(--felt);
    background-image: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.07), rgba(0, 0, 0, 0.22));
    border: 4px solid var(--felt-edge);
    box-sizing: border-box;
    box-shadow: inset 0 0 0 2px var(--gold-deep), 0 10px 30px var(--shadow);
    border-radius: 0;
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

.table-button {
    position: absolute;
    padding: 8px 22px;
    font-size: 16px;
    font-weight: bold;
    color: var(--ink);
    background: var(--ivory);
    border: none;
    border-radius: 0;
    cursor: pointer;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
    z-index: 6;
}
.table-button:hover {
    background: var(--gold);
}
.table-button:disabled {
    background: var(--ivory-3);
    color: var(--ink-soft);
    cursor: not-allowed;
    box-shadow: none;
}
.play-button {
    top: 100%;
    left: 50%;
    transform: translateX(110px) translateY(30px);
    font-size: 24px;
    padding: 16px 44px;
    border-radius: 0;
}
.play-button:disabled, .play-button:disabled:hover {
    background: var(--felt-deep);
    color: var(--muted);
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.7;
}
.play-button.armed {
    background: linear-gradient(45deg, var(--gold-bright), var(--gold));
    transform: translateX(110px) translateY(30px) scale(1.1);
    box-shadow: 0 0 18px 4px rgba(212, 175, 55, 0.55), 0 3px 6px rgba(0, 0, 0, 0.3);
    animation: armedPulse 1.4s ease-in-out infinite;
}
.play-button.armed:hover {
    filter: brightness(1.08);
}
@keyframes armedPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7), 0 3px 6px rgba(0, 0, 0, 0.3); transform: translateX(110px) translateY(30px) scale(1.08); }
    50% { box-shadow: 0 0 0 14px rgba(212, 175, 55, 0), 0 3px 6px rgba(0, 0, 0, 0.3); transform: translateX(110px) translateY(30px) scale(1.14); }
}
@media (prefers-reduced-motion: reduce) {
    .play-button.armed {
        animation: none;
    }
}
.blind-button {
    top: 50%;
    left: 50%;
    transform: translate(-50%, 122px);
    font-size: 30px;
    padding: 18px 56px;
}
.won-tricks-bottom {
    top: 88%;
    left: 78%;
}
.discard-blind-bottom {
    top: 88%;
    left: 22%;
}

.blind-stack {
    position: absolute;
    top: 30%;
    left: 5%;
    width: 0;
    height: 0;
    transform: scale(0.74);
    pointer-events: none;
}
.blind-stack-card {
    position: absolute;
    left: -35px;
    top: -50px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
.blind-stack-card:nth-child(2) { transform: translate(2px, -2px) rotate(-2deg); }
.blind-stack-card:nth-child(3) { transform: translate(4px, -4px) rotate(2deg); }
.blind-stack-card:nth-child(4) { transform: translate(6px, -6px) rotate(-1deg); }
.blind-stack-card:nth-child(5) { transform: translate(8px, -8px) rotate(1deg); }

.shuffle {
    position: absolute;
    top: 42%;
    left: 50%;
    width: 0;
    height: 0;
}
.shuffle-card {
    position: absolute;
    transform: translate(-50%, -50%);
    animation: shuffleSlide 1.6s ease-in-out infinite;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
@keyframes shuffleSlide {
    0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
    25% { transform: translate(-130%, -50%) rotate(-8deg); }
    50% { transform: translate(-50%, -50%) rotate(0deg); }
    75% { transform: translate(30%, -50%) rotate(8deg); }
}
.board-caption {
    position: absolute;
    top: 62%;
    left: 50%;
    transform: translateX(-50%);
    color: var(--ivory);
    font-family: Arial, sans-serif;
    font-size: 20px;
    letter-spacing: 1px;
    white-space: nowrap;
    pointer-events: none;
}
.board-caption.low {
    top: 86%;
}
.board-caption.corner {
    top: 14px;
    left: 16px;
    transform: none;
    max-width: 222px;
    overflow: hidden;
    text-overflow: ellipsis;
}
.board-caption.mine {
    font-size: 30px;
    font-weight: bold;
    color: var(--gold-bright);
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}
.board-caption.corner.mine {
    top: 8px;
    font-size: 44px;
    line-height: 1;
    max-width: 340px;
}
.board-caption.lead {
    top: 42%;
    transform: translate(-50%, -50%);
    width: 76%;
    font-size: 54px;
    font-weight: bold;
    letter-spacing: 3px;
    line-height: 1.1;
    white-space: normal;
    text-align: center;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}
.board-caption.lead.mine {
    font-size: 62px;
}
.caption-fade-enter-active, .caption-fade-leave-active {
    transition: opacity 0.35s ease;
}
.caption-fade-enter-from, .caption-fade-leave-to {
    opacity: 0;
}
.joker-badge {
    position: absolute;
    width: 40px;
    height: 40px;
    line-height: 40px;
    text-align: center;
    font-size: 28px;
    font-weight: bold;
    background: #ffffff;
    border: 2px solid #2c3e50;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
    transform: translate(-50%, -50%);
    z-index: 5;
    pointer-events: none;
}
.joker-badge.suit-red { color: #c0392b; }
.joker-badge.suit-black { color: #111111; }
.badge-bottom { top: 62%; left: calc(50% + 92px); }
.badge-top { top: 22%; left: calc(50% - 92px); }
.badge-left { top: calc(42% - 92px); left: 28%; }
.badge-right { top: calc(42% + 92px); left: 72%; }

.suit-chooser {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translate(-50%, -300px);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(32, 50, 67, 0.95);
    border: 2px solid #f1c40f;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    z-index: 7;
}
.suit-chooser-label {
    color: #ecf0f1;
    font-family: Arial, sans-serif;
    font-size: 14px;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-right: 6px;
    white-space: nowrap;
}
.suit-option {
    width: 48px;
    height: 48px;
    font-size: 32px;
    line-height: 1;
    background: #ffffff;
    border: 3px solid transparent;
    cursor: pointer;
}
.suit-option.suit-red { color: #c0392b; }
.suit-option.suit-black { color: #111111; }
.suit-option:hover { border-color: #95a5a6; }
.suit-option.chosen { border-color: #f1c40f; box-shadow: 0 0 10px 2px rgba(241, 196, 15, 0.6); }

.deal-button {
    position: absolute;
    top: 70%;
    left: 50%;
    transform: translateX(-50%);
    padding: 22px 90px;
    font-size: 40px;
    font-weight: bold;
    letter-spacing: 2px;
    color: var(--ink);
    background: linear-gradient(45deg, var(--gold-bright), var(--gold));
    border: none;
    border-radius: 0;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    animation: dealPulse 1.2s ease-in-out infinite;
}
.deal-button:hover {
    filter: brightness(1.1);
}
@keyframes dealPulse {
    0%, 100% { transform: translateX(-50%) scale(1); }
    50% { transform: translateX(-50%) scale(1.06); }
}

.portrait #gameTableContainer {
    top: calc(265px + var(--hand-shift, 0px));
    width: 800px;
    height: 600px;
    transition: top 0.3s ease;
}
.portrait #gameTable {
    height: 600px;
}
.portrait .play-button {
    font-size: 36px;
    padding: 24px 60px;
}
.portrait .card-played-left {
    left: 35%;
}
.portrait .card-played-right {
    left: 65%;
}
</style>
