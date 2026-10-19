import { JOKER, SUITS } from './cards.js';
import { PASS, LEFT_BOWER_OF, RIGHT_BOWER_OF, effectiveSuit, cardStrength, trickWinner, legalPlays, lowestCards, bidValue } from './rules.js';

const trumpsIn = (hand, suit) => hand.filter(c => effectiveSuit(c, suit) === suit);
const hasHonour = (hand, suit) => hand.includes(JOKER) || hand.includes(RIGHT_BOWER_OF[suit]) || hand.includes(LEFT_BOWER_OF[suit]);
const cheapness = (card, trump) => (effectiveSuit(card, trump) === trump ? 100 : 0) + cardStrength(card, trump);
const cheapest = (cards, trump) => cards.slice().sort((a, b) => cheapness(a, trump) - cheapness(b, trump))[0];

export function chooseBid(hand, highest) {
    let suit = SUITS[0];
    SUITS.forEach(s => { if (trumpsIn(hand, s).length > trumpsIn(hand, suit).length) suit = s; });
    const n = trumpsIn(hand, suit).length;
    const tricks = n >= 6 ? 7 : n >= 4 && hasHonour(hand, suit) ? 6 : 0;
    if (!tricks) return PASS;
    const bid = bidValue(tricks, suit);
    return bid > highest ? bid : PASS;
}

export function chooseDiscards(hand, trump) {
    const off = hand.filter(c => effectiveSuit(c, trump) !== trump);
    const discards = lowestCards(off, 5);
    return discards.concat(lowestCards(hand.filter(c => !off.includes(c)), 5 - discards.length));
}

export function chooseCard(hand, playedCards, leader, trump, jokerSuit, pos) {
    const legal = legalPlays(hand, playedCards, leader, trump, jokerSuit);
    if (legal.length === 1) return legal[0];
    if (playedCards.every(c => !c)) return chooseLead(legal, trump);
    if (trickWinner(playedCards, leader, trump) === (pos + 2) % 4) return cheapest(legal, trump);
    const winners = legal.filter(card => {
        const trial = playedCards.slice();
        trial[pos] = card;
        return trickWinner(trial, leader, trump) === pos;
    });
    return cheapest(winners.length ? winners : legal, trump);
}

function chooseLead(legal, trump) {
    const off = legal.filter(c => effectiveSuit(c, trump) !== trump);
    if (off.length) return off.slice().sort((a, b) => cardStrength(b, trump) - cardStrength(a, trump))[0];
    return cheapest(legal, trump);
}
