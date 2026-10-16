const NAME_KEY = '500.playerName';
const TOKEN_PREFIX = '500.token.';
const HAND_PREFIX = '500.hand.';
const THEME_LEVEL_KEY = '500.themeLevel';
export const THEME_LEVELS = { LIGHT: 'light', FULL: 'full' };

function storage() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function loadName() {
    return storage()?.getItem(NAME_KEY) ?? '';
}

export function saveName(name) {
    storage()?.setItem(NAME_KEY, name.trim());
}

export function loadThemeLevel() {
    return storage()?.getItem(THEME_LEVEL_KEY) === THEME_LEVELS.FULL ? THEME_LEVELS.FULL : THEME_LEVELS.LIGHT;
}

export function saveThemeLevel(level) {
    storage()?.setItem(THEME_LEVEL_KEY, level);
}

export function loadToken(gameId) {
    return storage()?.getItem(TOKEN_PREFIX + gameId.toUpperCase()) ?? '';
}

export function saveToken(gameId, token) {
    storage()?.setItem(TOKEN_PREFIX + gameId.toUpperCase(), token);
}

export function forgetToken(gameId) {
    storage()?.removeItem(TOKEN_PREFIX + gameId.toUpperCase());
    storage()?.removeItem(HAND_PREFIX + gameId.toUpperCase());
}

export function loadHandOrder(gameId) {
    try {
        const cards = JSON.parse(storage()?.getItem(HAND_PREFIX + gameId.toUpperCase()) ?? '[]');
        return Array.isArray(cards) ? cards : [];
    } catch {
        return [];
    }
}

export function saveHandOrder(gameId, cards) {
    storage()?.setItem(HAND_PREFIX + gameId.toUpperCase(), JSON.stringify(cards));
}

export function normalizeGameId(raw) {
    return (raw ?? '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
}

export function gameLink(gameId) {
    return `${window.location.origin}${import.meta.env.BASE_URL}g/${gameId.toUpperCase()}`;
}
