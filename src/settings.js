import { saveThemeLevel, saveCardArt, THEME_LEVELS, CARD_ARTS } from './session.js';

export const THEME_OPTIONS = [
    { value: THEME_LEVELS.LIGHT, label: 'Light', hint: 'Tab icon and card backs' },
    { value: THEME_LEVELS.FULL, label: 'Full', hint: 'Table, colors and more' },
];

export const CARD_ART_OPTIONS = [
    { value: CARD_ARTS.PICTURES, label: 'Pictures', hint: 'Illustrated card faces' },
    { value: CARD_ARTS.SIMPLE, label: 'Simple', hint: 'Big rank and suit only' },
];

export function chooseThemeLevel(store, value) {
    if (value === store.state.themeLevel) return;
    saveThemeLevel(value);
    store.commit('setThemeLevel', value);
}

export function chooseCardArt(store, value) {
    if (value === store.state.cardArt) return;
    saveCardArt(value);
    store.commit('setCardArt', value);
}
