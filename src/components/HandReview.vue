<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex'
import { JOKER, SUIT_SYMBOLS, cardStr2CardObj, isValidCardStr } from '../game/cards.js';
import { PASS, isValidBid, neededTricks, trumpSuitForBid } from '../game/rules.js';

const store = useStore();
const GLYPHS = { only: '–', blunder: '?', gamble: '!!', close: '', best: '✓' };
const WORDS = { only: 'Only choice', blunder: 'Blunder', gamble: 'Gamble', close: 'Close call', best: 'Best play' };
const review = computed(() => store.state.handReview);
const moves = computed(() => Array.isArray(review.value?.moves?.[0]) ? review.value.moves[0].slice(0, 10) : []);
const myBid = computed(() => review.value?.bids?.[0] ?? null);
const scores = computed(() => Array.isArray(review.value?.scores) ? review.value.scores : []);
const names = computed(() => store.state.playerNames);
const hovered = ref(null);
const picked = ref(null);
const active = computed(() => hovered.value ?? picked.value);
const gradeClass = (grade) => GLYPHS[grade] !== undefined ? grade : 'only';
const bidDiffers = computed(() => !!myBid.value && Number.isInteger(myBid.value.suggested) && myBid.value.suggested !== myBid.value.bid);

function cardLabel(card) {
    if (card === JOKER) return 'Joker';
    if (!isValidCardStr(card)) return '?';
    const { v, s } = cardStr2CardObj(card);
    return v + SUIT_SYMBOLS[s];
}
function bidLabel(bid) {
    if (bid === PASS) return 'Pass';
    if (!isValidBid(bid)) return '?';
    return `${neededTricks(bid)}${SUIT_SYMBOLS[trumpSuitForBid(bid)]}`;
}
function describe(key) {
    if (key === 'bid') {
        const b = myBid.value;
        if (!b) return '';
        return `Bid ${bidLabel(b.bid)} · ${WORDS[b.grade] ?? b.grade}${bidDiffers.value ? ` · better ${bidLabel(b.suggested)}` : ''}`;
    }
    const m = moves.value[key];
    if (!m) return '';
    const better = m.best && m.best !== m.card ? ` · better ${cardLabel(m.best)}` : '';
    return `Trick ${key + 1}: ${cardLabel(m.card)} · ${WORDS[m.grade] ?? m.grade}${better}`;
}
const detail = computed(() => active.value === null ? '' : describe(active.value));
const others = computed(() => [1, 2, 3].map(p => `${names.value[p]} ${scores.value[p] ?? '–'}`).join(' · '));
function toggle(key) {
    hovered.value = null;
    picked.value = picked.value === key ? null : key;
}
</script>

<template>
    <div class="hand-review">
        <div class="review-row">
            <template v-if="myBid">
                <button class="review-dot" :class="gradeClass(myBid.grade)" type="button" :aria-label="describe('bid')" @mouseenter="hovered = 'bid'" @mouseleave="hovered = null" @click="toggle('bid')">
                    <svg v-if="gradeClass(myBid.grade) === 'close'" class="review-book" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 5.5c3-1.6 6-1.6 9 0v13.5c-3-1.6-6-1.6-9 0z" /><path d="M21.5 5.5c-3-1.6-6-1.6-9 0v13.5c3-1.6 6-1.6 9 0z" /></svg>
                    <template v-else>{{ GLYPHS[gradeClass(myBid.grade)] }}</template>
                </button>
                <span class="review-text review-bidtext">Bid {{ bidLabel(myBid.bid) }}<span v-if="bidDiffers" class="review-better"> → {{ bidLabel(myBid.suggested) }}</span></span>
            </template>
            <span class="review-dots">
                <button v-for="(m, i) in moves" :key="i" class="review-dot" :class="[gradeClass(m.grade), { picked: picked === i }]" type="button" :aria-label="describe(i)" @mouseenter="hovered = i" @mouseleave="hovered = null" @click="toggle(i)">
                    <svg v-if="gradeClass(m.grade) === 'close'" class="review-book" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 5.5c3-1.6 6-1.6 9 0v13.5c-3-1.6-6-1.6-9 0z" /><path d="M21.5 5.5c-3-1.6-6-1.6-9 0v13.5c3-1.6 6-1.6 9 0z" /></svg>
                    <template v-else>{{ GLYPHS[gradeClass(m.grade)] }}</template>
                </button>
            </span>
            <span class="review-text review-score">Play <b>{{ scores[0] ?? '–' }}</b><small>/100</small></span>
        </div>
        <div class="review-line" :class="{ detail: !!detail }">{{ detail || others }}</div>
    </div>
</template>

<style scoped>
.hand-review {
    position: absolute;
    left: 50%;
    bottom: 8px;
    transform: translateX(-50%);
    max-width: 96%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    font-family: Arial, sans-serif;
    color: var(--on-felt);
    z-index: 6;
}
.review-row {
    display: flex;
    align-items: center;
    gap: 12px;
}
.review-dots {
    display: flex;
    gap: 5px;
}
.review-dot {
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.55);
    color: var(--ivory);
    font-family: inherit;
    font-size: 15px;
    font-weight: bold;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.review-dot:hover, .review-dot.picked {
    border-color: var(--ivory);
    transform: translateY(-2px);
}
.review-dot.only { background: #6f7f78; }
.review-dot.blunder { background: var(--card-red); }
.review-dot.gamble { background: #2457a6; }
.review-dot.close { background: #8a5a2b; }
.review-dot.best { background: #2f8f4e; }
.review-book {
    width: 18px;
    height: 18px;
    fill: var(--ivory);
    stroke: var(--ivory);
    stroke-width: 1;
    stroke-linejoin: round;
}
.review-text {
    font-size: 16px;
    white-space: nowrap;
}
.review-bidtext {
    margin-left: -6px;
}
.review-better {
    color: var(--gold-ink);
    font-weight: bold;
}
.review-score b {
    font-size: 20px;
}
.review-score small {
    font-size: 12px;
    color: var(--on-felt-soft);
}
.review-line {
    max-width: 100%;
    font-size: 14px;
    color: var(--on-felt-soft);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.review-line.detail {
    color: var(--on-felt);
    font-weight: bold;
}

.portrait .hand-review {
    bottom: 10px;
    gap: 4px;
}
.portrait .review-row {
    gap: 10px;
}
.portrait .review-dot {
    width: 36px;
    height: 36px;
    font-size: 19px;
}
.portrait .review-book {
    width: 22px;
    height: 22px;
}
.portrait .review-text {
    font-size: 18px;
}
.portrait .review-score b {
    font-size: 23px;
}
.portrait .review-line {
    font-size: 17px;
}
</style>
