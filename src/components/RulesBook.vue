<script setup>
import { ref, computed } from 'vue';
import { WIKIPEDIA_URL } from '../config.js';

const open = ref(false);
const page = ref(0);
const red = (t) => `<span class="red">${t}</span>`;
const black = (t) => `<span class="black">${t}</span>`;
const shinyRed = (t) => `<span class="red shiny">${t}</span>`;
const shinyBlack = (t) => `<span class="black shiny">${t}</span>`;

const BID_ROWS = [6, 7, 8, 9, 10];
const BID_COLS = [
    { label: '♠', cls: 'black' }, { label: '♣', cls: 'black' }, { label: '♦', cls: 'red' }, { label: '♥', cls: 'red' }, { label: 'NT', cls: '' },
];
const bidAt = (r, c) => 40 + r * 100 + c * 20;
const TRUMP_ORDER = ['4', '5', '6', '7', '8', '9', '10', 'Q', 'K', 'A', 'J<sub>L</sub>', 'J<sub>R</sub>', 'Joker'];

const PAGES = [
    { title: 'Deck and deal', sections: [
        { heading: 'Deck', lines: [
            '2 teams of 2 players.',
            '45-card deck, all 2s and 3s removed + 1 joker.',
        ]},
        { heading: 'Deal', lines: [
            "Each player is dealt a 10-card hand, don't tell anyone what you got!",
            'A 5-card blind is dealt to the middle.',
            'Deal passes to the left after a hand completes.',
        ]},
    ]},
    { title: 'Bidding', sections: [
        { heading: 'Bidding', lines: [
            'Player to the left of the dealer will bid first, and it continues clockwise (left).',
            "You're bidding on the number of tricks you and your partner can win together this hand, and in which suit you'll accomplish this.",
            'Lowest you can bid is 6 of 10 tricks, highest is obviously 10.',
        ]},
        { heading: 'Points', bidTable: true },
        { heading: 'Scoring nuances', lines: [
            'If you make your bid, you score exactly the number of points you bid.',
            "It's that simple. Unless you take all 10 tricks... then, you get 250 points.",
            "It's that simple. Unless your bid was over 250 points. Then you just get the number of points you bid.",
            'First team to 500 wins! We play with -500 loses.',
        ]},
    ]},
    { title: 'Gameplay', sections: [
        { heading: 'Gameplay — Blind', lines: [
            "The winning bidder (if there is one) will pick up the 5-card blind and strategically exchange with their hand until they're holding the 10 they think they can win with.",
            "When they're ready, they'll discard the 5 they're trashing.",
            'Then, they play a card to lead the first trick.',
        ]},
        { heading: 'Gameplay — The Trick', lines: [
            'One trick is a single go-round the table where each player lays one card in order from the leader.',
            'The bid-winner leads first, then whoever wins a given trick will always lead the next.',
            'You <strong>must</strong> follow the suit that is led for the trick, <strong>unless</strong> you have 0 cards in that suit at all, in which case you can lay literally <strong>whatever you want</strong>.',
            'At the end of the trick, the highest trump card played wins the trick. If no trump cards were played, then the highest card in the suit which was led wins the trick.',
            "We'll go around the table 10 times until everyone has played all 10 of their cards! Good luck!",
        ]},
    ]},
    { title: 'FYIs', sections: [
        { heading: 'FYIs — Bowers', lines: [
            `ONLY for hands when the trump suit is ${red('RED')} — e.g. ${shinyRed('Diamonds')} + ${shinyRed('Hearts')} — both ${red('RED')} jacks get promoted.`,
            `ONLY for hands when the trump suit is ${black('BLACK')} — e.g. ${shinyBlack('Spades')} + ${shinyBlack('Clubs')} — the ${black('BLACK')} jacks are promoted.`,
            'The jack in the actual trump suit is VERY important, and he is henceforth known as the "Right Bower" for this hand.',
            'The jack in the trump COLOR, but not the actual trump suit, is PROMOTED to TRUMP suit 💆 and is known as "Left Bower" for this hand. But he is still less important than Mr. Right.',
        ], trumpOrder: true },
        { heading: 'FYIs — Timers', lines: [
            'You have 45 seconds to bid, 45 seconds to sort out the blind, and 30 seconds to play a card.',
            'The dealer has 15 seconds to deal before the table deals for them.',
            'When your time runs out the table plays for you: the card in your play box, or the lowest legal card.',
            'If you are holding a card when time runs out, that card is played.',
        ]},
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
                    <section v-for="(sec, i) in current.sections" :key="i" class="book-section">
                        <h3 class="book-heading">{{ sec.heading }}</h3>
                        <p v-for="(line, j) in sec.lines ?? []" :key="j" class="book-line" v-html="line"></p>
                        <table v-if="sec.bidTable" class="bid-table">
                            <thead>
                                <tr><th>Tricks</th><th v-for="c in BID_COLS" :key="c.label" :class="c.cls">{{ c.label }}</th></tr>
                            </thead>
                            <tbody>
                                <tr v-for="(tricks, r) in BID_ROWS" :key="tricks">
                                    <th>{{ tricks }}</th>
                                    <td v-for="(c, ci) in BID_COLS" :key="c.label">{{ bidAt(r, ci) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-if="sec.trumpOrder" class="trump-order">
                            <div class="trump-order-label">Trump suit card value order, low to high:</div>
                            <div class="trump-chips">
                                <span v-for="(c, k) in TRUMP_ORDER" :key="k" class="trump-chip" :class="{ hot: k >= 10 }" v-html="c"></span>
                            </div>
                        </div>
                    </section>
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
    width: min(720px, 92vw);
    max-height: 90vh;
    background: #f4ecd8;
    color: #2c3e50;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    border: 3px solid #2c3e50;
    font-family: Georgia, 'Times New Roman', serif;
}
.book-spine {
    width: 26px;
    flex: none;
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
    margin: 14px 0 6px;
    font-size: 30px;
    font-weight: normal;
    border-bottom: 2px solid #2c3e50;
    padding-bottom: 8px;
}
.book-section { margin-top: 18px; }
.book-heading {
    margin: 0 0 6px;
    font-size: 19px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #7b241c;
}
.book-line {
    font-size: 17px;
    line-height: 1.5;
    margin: 8px 0;
}
.book-line :deep(.red) { color: #c0392b; font-weight: bold; }
.book-line :deep(.black) { color: #111; font-weight: bold; }
.book-line :deep(.shiny) {
    text-shadow: 0 0 6px rgba(241, 196, 15, 0.9), 0 0 2px rgba(255, 255, 255, 0.9);
    letter-spacing: 0.5px;
}
.bid-table {
    border-collapse: collapse;
    margin: 8px 0 4px;
    font-size: 17px;
    text-align: center;
}
.bid-table th, .bid-table td {
    border: 2px solid #2c3e50;
    padding: 6px 14px;
}
.bid-table thead th { background: #2c3e50; color: #f4ecd8; font-size: 20px; }
.bid-table thead th.red { color: #ff8a80; }
.bid-table tbody th { background: #e6dcc3; }
.trump-order { margin-top: 12px; }
.trump-order-label { font-size: 15px; margin-bottom: 6px; }
.trump-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.trump-chip {
    border: 2px solid #2c3e50;
    padding: 4px 9px;
    font-size: 16px;
    font-weight: bold;
    background: #fff;
}
.trump-chip.hot { background: #2c3e50; color: #f1c40f; }
.trump-chip :deep(sub) { font-size: 11px; }
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
