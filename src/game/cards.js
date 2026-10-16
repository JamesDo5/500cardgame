
export const SUITS = ['s', 'c', 'd', 'h'];
export const VALUES = ['4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const JOKER = 'j';
export const HIDDEN_CARD = '?';
export const POS_NAMES = ['Bottom', 'Left', 'Top', 'Right'];
export const SUIT_SYMBOLS = { s: '♠', c: '♣', d: '♦', h: '♥', n: 'NT' };
export const RED_SUITS = new Set(['d', 'h']);
export function suitColorClass(suit) {
    return RED_SUITS.has(suit) ? 'suit-red' : 'suit-black';
}

const SUIT_CLASS = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades', j: 'joker' };

export function cardObj2Str(card) {
    return card.v + card.s;
}

export function cardStr2CardObj(cardStr) {
    if (cardStr.slice(-1) === JOKER) return { v: '', s: JOKER };
    return { v: cardStr.slice(0, -1), s: cardStr.slice(-1) };
}

export function isValidCardStr(cardStr) {
    if (typeof cardStr !== 'string') return false;
    if (cardStr === JOKER) return true;
    const { v, s } = cardStr2CardObj(cardStr);
    return SUITS.includes(s) && VALUES.includes(v);
}

export function isHiddenCard(cardStr) {
    return cardStr === HIDDEN_CARD;
}

export function hiddenHand(n) {
    return Array.from({ length: Math.max(0, n) }, () => HIDDEN_CARD);
}

export function getSuitClass(suit) {
    return SUIT_CLASS[suit] ?? '';
}

export function getPosName(pos) {
    return POS_NAMES[pos] ?? `Unknown(${pos})`;
}

export function teamOf(pos) {
    return pos % 2;
}

export function otherTeam(team) {
    return (team + 1) % 2;
}

const ASSET_BASE = import.meta.env.BASE_URL ?? '/';
export function cardImageUrl(cardStr) {
    return `${ASSET_BASE}cards/${cardStr}.jpeg`;
}
export const CARD_BACK_URL = `${ASSET_BASE}cards/cat_cardback.jpeg`;

const preloaded = new Set();
export function preloadCardImages(cards) {
    cards.forEach(card => {
        const url = cardImageUrl(card);
        if (preloaded.has(url)) return;
        preloaded.add(url);
        const img = new Image();
        img.src = url;
    });
}

const BACK_STYLE = {
    s: { field: '#1b1b1b', glyph: '#f6efdb', size: 7 },
    c: { field: '#163d2a', glyph: '#f6efdb', size: 7 },
    d: { field: '#b61c2b', glyph: '#f6efdb', size: 7 },
    h: { field: '#7f1220', glyph: '#f6efdb', size: 7 },
    n: { field: '#1c2f5a', glyph: '#d4af37', size: 4 },
};
const backCache = {};
export function cardBackUrl(trump) {
    const style = BACK_STYLE[trump];
    if (!style) return CARD_BACK_URL;
    if (!backCache[trump]) {
        const sym = SUIT_SYMBOLS[trump];
        const glyph = (x, y) => `<text x="${x}" y="${y}" font-size="${style.size}" font-weight="bold" font-family="Arial, sans-serif" fill="${style.glyph}" fill-opacity="0.55" text-anchor="middle" dominant-baseline="central">${sym}</text>`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100"><defs><pattern id="p" width="14" height="14" patternUnits="userSpaceOnUse">${glyph(3.5, 3.5)}${glyph(10.5, 10.5)}</pattern></defs><rect width="70" height="100" fill="#f6efdb"/><rect x="4" y="4" width="62" height="92" fill="${style.field}"/><rect x="4" y="4" width="62" height="92" fill="url(#p)"/><rect x="6.5" y="6.5" width="57" height="87" fill="none" stroke="#d4af37" stroke-width="1.4"/><circle cx="35" cy="50" r="14" fill="#f6efdb" stroke="#d4af37" stroke-width="1.4"/><text x="35" y="50" font-size="${trump === 'n' ? 11 : 20}" font-weight="bold" font-family="Arial, sans-serif" fill="${style.field}" text-anchor="middle" dominant-baseline="central">${sym}</text><rect x="4" y="4" width="62" height="92" fill="none" stroke="#1b1b1b" stroke-width="0.8"/></svg>`;
        backCache[trump] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }
    return backCache[trump];
}

export function cardPlaceholderSvg(cardStr) {
    let svg;
    if (!cardStr || cardStr === HIDDEN_CARD) {
        svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100"><rect width="70" height="100" fill="#1f4e8c"/><rect x="5" y="5" width="60" height="90" fill="none" stroke="#f1c40f" stroke-width="2"/></svg>';
    } else {
        const { v, s } = cardStr2CardObj(cardStr);
        const joker = s === JOKER;
        const label = joker ? 'JOKER' : v;
        const sym = joker ? '★' : SUIT_SYMBOLS[s];
        const color = RED_SUITS.has(s) ? '#c0392b' : '#111111';
        const size = joker ? 9 : 16;
        const corner = `<text x="5" y="18" font-size="${size}" font-weight="bold" font-family="Arial, sans-serif" fill="${color}">${label}</text><text x="5" y="36" font-size="17" font-family="Arial, sans-serif" fill="${color}">${sym}</text>`;
        svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100"><rect width="70" height="100" fill="#ffffff" stroke="#2c3e50" stroke-width="2"/>${corner}<g transform="rotate(180 35 50)">${corner}</g></svg>`;
    }
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export const CARD_BACK_PLACEHOLDER = cardPlaceholderSvg(HIDDEN_CARD);

export function installCardImageFallback() {
    document.documentElement.style.setProperty('--card-back-placeholder', `url("${CARD_BACK_PLACEHOLDER}")`);
    document.addEventListener('error', (evt) => {
        const img = evt.target;
        if (!(img instanceof HTMLImageElement) || img.src.startsWith('data:')) return;
        const card = img.dataset.card ?? img.closest('[data-card]')?.dataset.card ?? (img.src.includes('cardback') ? HIDDEN_CARD : '');
        if (!card) return;
        img.src = cardPlaceholderSvg(card);
    }, true);
}

export function elem2CardStr(elem) {
    const str = elem?.dataset?.card;
    if (!isValidCardStr(str)) {
        console.error('elem2CardStr() -- element has no valid data-card:', elem);
        return '';
    }
    return str;
}

export function produceCardHtml(cardStr, faceDown, outerClass, backUrl = CARD_BACK_URL) {
    const { s } = cardStr2CardObj(cardStr);
    const faceClass = faceDown ? 'card-back' : `card-front ${getSuitClass(s)}`;
    const src = faceDown ? backUrl : cardImageUrl(cardStr);
    const placeholder = cardPlaceholderSvg(faceDown ? HIDDEN_CARD : cardStr);
    return `<div class="${outerClass} ${faceClass}" data-card="${cardStr}"><img draggable="false" src="${src}" style="background-image:url('${placeholder}')"></div>`;
}

export function buildDeck() {
    return VALUES.flatMap(v => SUITS.map(s => v + s)).concat(JOKER);
}

export function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

export function dealMock() {
    const deck = shuffle(buildDeck());
    return {
        hands: [deck.slice(0, 10), deck.slice(10, 20), deck.slice(20, 30), deck.slice(30, 40)],
        blind: deck.slice(40, 45),
    };
}
