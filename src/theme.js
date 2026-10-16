import { SUIT_SYMBOLS, RED_SUITS } from './game/cards.js';

export function activeTrump(state) {
    return state.gameState >= 3 && state.gameState <= 5 ? state.trumpSuit : '';
}

const faviconCache = {};
export function suitFaviconUrl(suit) {
    if (!SUIT_SYMBOLS[suit]) return '';
    if (!faviconCache[suit]) {
        const nt = suit === 'n';
        const bg = nt ? '#1c2f5a' : '#f6efdb';
        const fg = nt ? '#d4af37' : RED_SUITS.has(suit) ? '#b61c2b' : '#161616';
        const size = nt ? 26 : 48;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="${bg}"/><rect x="4" y="4" width="56" height="56" rx="7" fill="none" stroke="${fg}" stroke-width="3"/><text x="32" y="34" font-size="${size}" font-weight="bold" font-family="Arial, sans-serif" fill="${fg}" text-anchor="middle" dominant-baseline="central">${SUIT_SYMBOLS[suit]}</text></svg>`;
        faviconCache[suit] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }
    return faviconCache[suit];
}

function faviconLink() {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    if (link.dataset.defaultHref === undefined) link.dataset.defaultHref = link.getAttribute('href') ?? '';
    return link;
}

export function applyTrumpTheme(suit, level) {
    const root = document.documentElement;
    if (suit) {
        root.dataset.trump = suit;
        root.dataset.themeLevel = level;
    } else {
        delete root.dataset.trump;
        delete root.dataset.themeLevel;
    }
    const link = faviconLink();
    if (suit) {
        link.type = 'image/svg+xml';
        link.href = suitFaviconUrl(suit);
    } else {
        link.removeAttribute('type');
        link.href = link.dataset.defaultHref;
    }
}
