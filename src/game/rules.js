import { cardStr2CardObj, JOKER, SUITS, teamOf, otherTeam } from './cards.js';

export const NO_TRUMP = 'n';
export const PASS = 0;
export const MIN_BID = 40;
export const MAX_BID = 520;
export const SLAM_BONUS = 250;

const BID_SUIT_CYCLE = ['h', NO_TRUMP, 's', 'c', 'd'];
export function trumpSuitForBid(bid) {
    if (bid < MIN_BID || bid > MAX_BID || bid % 20 !== 0) return '';
    return BID_SUIT_CYCLE[(bid / 20) % 5];
}

export function neededTricks(bid) {
    return Math.floor((bid + 560) / 100);
}

export function isValidBid(bid) {
    return bid === PASS || (bid >= MIN_BID && bid <= MAX_BID && bid % 20 === 0);
}

const FACE_VALUES = { J: 11, Q: 12, K: 13, A: 14 };
export const LEFT_BOWER_OF = { s: 'Jc', c: 'Js', d: 'Jh', h: 'Jd' };
export const RIGHT_BOWER_OF = { s: 'Js', c: 'Jc', d: 'Jd', h: 'Jh' };

export function bowerOf(cardStr, trump) {
    if (!trump || trump === NO_TRUMP) return '';
    if (cardStr === RIGHT_BOWER_OF[trump]) return 'right';
    if (cardStr === LEFT_BOWER_OF[trump]) return 'left';
    return '';
}

export function effectiveSuit(cardStr, trump) {
    if (cardStr === JOKER) return trump;
    if (trump !== NO_TRUMP && (cardStr === LEFT_BOWER_OF[trump] || cardStr === RIGHT_BOWER_OF[trump])) return trump;
    return cardStr2CardObj(cardStr).s;
}

export function cardStrength(cardStr, trump) {
    if (cardStr === JOKER) return 17;
    if (trump !== NO_TRUMP) {
        if (cardStr === RIGHT_BOWER_OF[trump]) return 16;
        if (cardStr === LEFT_BOWER_OF[trump]) return 15;
    }
    const { v } = cardStr2CardObj(cardStr);
    return FACE_VALUES[v] ?? Number(v);
}

export function trickWinner(playedCards, leader, trump) {
    const ledSuit = effectiveSuit(playedCards[leader], trump);
    let winner = leader;
    for (let i = 1; i < 4; i++) {
        const pos = (leader + i) % 4;
        const card = playedCards[pos];
        if (!card) continue;
        if (beats(card, playedCards[winner], ledSuit, trump)) winner = pos;
    }
    return winner;
}

function beats(card, current, ledSuit, trump) {
    const cs = effectiveSuit(card, trump), ws = effectiveSuit(current, trump);
    if (cs === ws) return cardStrength(card, trump) > cardStrength(current, trump);
    if (cs === trump) return true;
    if (ws === trump) return false;
    return cs === ledSuit;
}

export function isNominatableSuit(suit) {
    return SUITS.includes(suit);
}

export function nominatesSuit(card, playedCards, leader, trump) {
    return card === JOKER && trump === NO_TRUMP && playedCards.every(c => !c) && leader >= 0;
}

export function ledSuit(playedCards, leader, trump, jokerSuit = '') {
    const leadCard = playedCards[leader];
    if (!leadCard) return '';
    if (leadCard === JOKER && trump === NO_TRUMP && isNominatableSuit(jokerSuit)) return jokerSuit;
    return effectiveSuit(leadCard, trump);
}

export function legalPlays(hand, playedCards, leader, trump, jokerSuit = '') {
    const led = ledSuit(playedCards, leader, trump, jokerSuit);
    if (!led) return hand.slice();
    const following = hand.filter(c => effectiveSuit(c, trump) === led);
    if (!following.length) return hand.slice();
    if (trump === NO_TRUMP && hand.includes(JOKER) && !following.includes(JOKER)) following.push(JOKER);
    return following;
}

export function longestSuit(hand) {
    const counts = SUITS.map(s => hand.filter(c => c !== JOKER && cardStr2CardObj(c).s === s).length);
    return SUITS[counts.indexOf(Math.max(...counts))];
}

export function nextToPlay(playedCards, leader) {
    for (let i = 0; i < 4; i++) {
        const pos = (leader + i) % 4;
        if (playedCards[pos] === '') return pos;
    }
    return -1;
}

export function nextToBid(bids, dealer) {
    for (let i = 1; i <= 4; i++) {
        const pos = (dealer + i) % 4;
        if (bids[pos] === -1) return pos;
    }
    return -1;
}

export function isBiddingOver(bids) {
    return !bids.includes(-1);
}

export function highestBid(bids) {
    return Math.max(...bids);
}

export function winningBidder(bids) {
    const hi = highestBid(bids);
    return hi > PASS ? bids.indexOf(hi) : -1;
}

export function scoreHand(bid, bidTeam, teamTricks) {
    const deltas = [0, 0];
    const made = teamTricks[bidTeam] >= neededTricks(bid);
    const slam = made && teamTricks[bidTeam] === 10 && bid < SLAM_BONUS;
    deltas[bidTeam] = slam ? SLAM_BONUS : made ? bid : -bid;
    deltas[otherTeam(bidTeam)] = 10 * teamTricks[otherTeam(bidTeam)];
    return { deltas, made };
}

export function gameOutcome(scores, bidTeam, made) {
    const lost = [scores[0] <= -500, scores[1] <= -500];
    const won = [scores[0] >= 500, scores[1] >= 500];
    if (lost[0] && !lost[1]) return 1;
    if (lost[1] && !lost[0]) return 0;
    if (lost[0] && lost[1]) return made ? bidTeam : otherTeam(bidTeam);
    if (won[0] && won[1]) return made ? bidTeam : otherTeam(bidTeam);
    if (won[0]) return 0;
    if (won[1]) return 1;
    return -1;
}

const SUIT_ORDER = ['s', 'c', 'd', 'h'];
export function sortHand(hand, trump, reversed = false) {
    const t = trump || NO_TRUMP;
    const order = reversed ? SUIT_ORDER.slice().reverse() : SUIT_ORDER.slice();
    const rank = (card) => {
        const suit = effectiveSuit(card, t);
        const group = suit === NO_TRUMP ? order.length : order.indexOf(suit);
        return [group, cardStrength(card, t)];
    };
    return hand.slice().sort((a, b) => {
        const [sa, va] = rank(a), [sb, vb] = rank(b);
        return sa - sb || va - vb;
    });
}

const NAIVE_SUIT_ORDER = ['s', 'c', 'd', 'h'];
export function lowestCards(hand, n) {
    const rank = (card) => {
        if (card === JOKER) return [99, 99];
        const { v, s } = cardStr2CardObj(card);
        return [FACE_VALUES[v] ?? Number(v), NAIVE_SUIT_ORDER.indexOf(s)];
    };
    return hand.slice().sort((a, b) => {
        const [va, sa] = rank(a), [vb, sb] = rank(b);
        return va - vb || sa - sb;
    }).slice(0, Math.max(0, n));
}

export function bidLabel(bid) {
    if (bid === PASS) return 'Pass';
    if (!isValidBid(bid)) return '';
    return { tricks: neededTricks(bid), suit: trumpSuitForBid(bid) };
}

export function trickWinnerWithout(playedCards, leader, trump, excludedPos) {
    const copy = playedCards.slice();
    copy[excludedPos] = '';
    if (excludedPos === leader) return -1;
    return trickWinner(copy, leader, trump);
}

export { teamOf };
