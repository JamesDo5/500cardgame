const NAME_KEY = '500.playerName';
const TOKEN_PREFIX = '500.token.';

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

export function loadToken(gameId) {
    return storage()?.getItem(TOKEN_PREFIX + gameId.toUpperCase()) ?? '';
}

export function saveToken(gameId, token) {
    storage()?.setItem(TOKEN_PREFIX + gameId.toUpperCase(), token);
}

export function forgetToken(gameId) {
    storage()?.removeItem(TOKEN_PREFIX + gameId.toUpperCase());
}

export function normalizeGameId(raw) {
    return (raw ?? '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
}

export function gameLink(gameId) {
    return `${window.location.origin}${import.meta.env.BASE_URL}g/${gameId.toUpperCase()}`;
}
