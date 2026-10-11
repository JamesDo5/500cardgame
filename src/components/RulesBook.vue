<script setup>
import { ref, computed } from 'vue';
import { WIKIPEDIA_URL } from '../config.js';

const open = ref(false);
const page = ref(0);
const PAGES = [
    { title: 'The deck and the deal', body: [
        'Four players in two fixed partnerships, partners sitting across from each other.',
        'The deck is 45 cards: 4 through Ace in all four suits plus one joker.',
        'Everyone gets 10 cards. The remaining 5 are the blind, face down in the middle.',
        'The deal passes to the left after each hand. If everyone passes, the same dealer deals again.',
    ]},
    { title: 'Bidding', body: [
        'One round only, starting left of the dealer. Each player bids once or passes.',
        'A bid names a number of tricks, 6 to 10, and a trump suit or no trump. It must beat the standing bid.',
        'Suit order from low to high is spades, clubs, diamonds, hearts, no trump.',
        'Points: 6 spades is 40 and each step up is 20, so 6 no trump is 120, 7 spades is 140, up to 10 no trump at 520.',
    ]},
    { title: 'The blind', body: [
        'The winning bidder picks up the 5 blind cards, now holding 15.',
        'They discard any 5 face down and keep 10. The discards are never shown.',
        'The bid winner leads the first trick.',
        'If the bid winner runs out of time, the client discards whatever is in their blind box and fills the rest with their lowest cards.',
    ]},
    { title: 'Trumps and bowers', body: [
        'In the trump suit the order from high to low is joker, right bower, left bower, A K Q 10 9 8 7 6 5 4.',
        'The right bower is the jack of trumps. The left bower is the jack of the same colour.',
        'The left bower counts as a trump, not as a card of its own suit.',
        'In no trump the joker is the only trump and jacks are ordinary cards.',
    ]},
    { title: 'Playing a trick', body: [
        'You must follow the suit led if you can. Bowers and the joker count as the trump suit.',
        'If trump is led and your only trump is the joker or a bower, you must play it.',
        'If you cannot follow suit you may play anything.',
        'Leading the joker leads the trump suit. In no trump the joker simply wins the trick.',
        'Highest trump wins, otherwise the highest card of the suit led. The winner leads next.',
    ]},
    { title: 'Scoring', body: [
        'If the bidding team takes at least the number of tricks bid, they score the bid value.',
        'If they fall short they lose the bid value.',
        'The other team scores 10 for every trick they take, whether the bid was made or not.',
        'Taking all 10 tricks on a bid worth less than 250 scores 250 instead.',
        'First team to 500 wins. A team at minus 500 loses. If both teams pass 500 on the same hand, the bidders win if they made their bid.',
    ]},
    { title: 'Timers', body: [
        'You have 45 seconds to bid, 45 seconds to sort out the blind, and 30 seconds to play a card.',
        'The dealer has 15 seconds to deal before the table deals for them.',
        'When your time runs out the table plays for you: the card in your play box, or the lowest legal card.',
        'If you are holding a card when time runs out, that card is played.',
    ]},
];
const current = computed(() => PAGES[page.value]);
function show() { page.value = 0; open.value = true; }
function hide() { open.value = false; }
defineExpose({ show });
</script>

<template>
    <Transition name="book">
        <div v-if="open" class="book-overlay" @click.self="hide">
            <div class="book">
                <div class="book-spine"></div>
                <div class="book-page">
                    <div class="book-header">
                        <span class="book-kicker">How we play 500</span>
                        <button class="book-close" type="button" @click="hide">×</button>
                    </div>
                    <h2 class="book-title">{{ current.title }}</h2>
                    <p v-for="(line, i) in current.body" :key="i" class="book-line">{{ line }}</p>
                    <div class="book-footer">
                        <button class="book-nav" type="button" :disabled="page === 0" @click="page--">Previous</button>
                        <span class="book-count">{{ page + 1 }} / {{ PAGES.length }}</span>
                        <button class="book-nav" type="button" :disabled="page === PAGES.length - 1" @click="page++">Next</button>
                    </div>
                    <a class="book-wiki" :href="WIKIPEDIA_URL" target="_blank" rel="noopener">500 on Wikipedia</a>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.book-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 18, 26, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
}
.book {
    display: flex;
    width: min(680px, 92vw);
    max-height: 88vh;
    background: #f4ecd8;
    color: #2c3e50;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    border: 3px solid #2c3e50;
    font-family: Georgia, 'Times New Roman', serif;
}
.book-spine {
    width: 26px;
    background: repeating-linear-gradient(180deg, #7b241c 0 14px, #922b21 14px 28px);
    border-right: 3px solid #2c3e50;
}
.book-page {
    flex: 1;
    padding: 28px 36px 24px;
    overflow-y: auto;
}
.book-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.book-kicker {
    font-size: 13px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #7b241c;
}
.book-close {
    background: none;
    border: 2px solid #2c3e50;
    color: #2c3e50;
    font-size: 22px;
    line-height: 1;
    width: 34px;
    height: 34px;
    cursor: pointer;
}
.book-close:hover { background: #2c3e50; color: #f4ecd8; }
.book-title {
    margin: 14px 0 10px;
    font-size: 30px;
    font-weight: normal;
    border-bottom: 2px solid #2c3e50;
    padding-bottom: 8px;
}
.book-line {
    font-size: 18px;
    line-height: 1.5;
    margin: 10px 0;
}
.book-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 22px;
    border-top: 2px solid #2c3e50;
    padding-top: 14px;
}
.book-nav {
    font-family: inherit;
    font-size: 16px;
    padding: 8px 18px;
    background: #2c3e50;
    color: #f4ecd8;
    border: 2px solid #2c3e50;
    cursor: pointer;
}
.book-nav:disabled { opacity: 0.35; cursor: default; }
.book-count { font-size: 15px; }
.book-wiki {
    display: inline-block;
    margin-top: 16px;
    color: #7b241c;
    font-size: 15px;
}
.book-enter-active, .book-leave-active { transition: opacity 0.25s; }
.book-enter-from, .book-leave-to { opacity: 0; }
</style>
