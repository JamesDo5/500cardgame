export const DEV = import.meta.env.DEV;
export const mode = { standalone: false };
export const LOCAL_GAME_ID = 'local';

export const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000/ws';
export const WIKIPEDIA_URL = 'https://en.wikipedia.org/wiki/500_(card_game)';
export const SITE_URL = 'https://jamesdouthit.com/';

export const TURN_TIMEOUT_MS = 30000;
export const BID_TIMEOUT_MS = 45000;
export const BLIND_TIMEOUT_MS = 45000;
export const BIG_COUNTDOWN_SECONDS = 10;
export const DEAL_TIMEOUT_MS = 15000;
export const AUTOPLAY_MARGIN_MS = 1000;
export const BOT_DELAY_MS = 900;
export const TRICK_HOLD_MS = 1100;
export const CARD_FLY_MS = 350;
export const TRICK_SWEEP_MS = 500;

export const TABLE_WIDTH = 800;
export const TABLE_HEIGHT = 560;
export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 1000;
