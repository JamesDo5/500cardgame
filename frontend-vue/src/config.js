export const STANDALONE = import.meta.env.DEV && import.meta.env.VITE_STANDALONE !== 'false';

export const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000';

export const TURN_TIMEOUT_MS = 30000;
export const BID_TIMEOUT_MS = 45000;
export const DEAL_TIMEOUT_MS = 15000;
export const AUTOPLAY_MARGIN_MS = 1000;
export const BOT_DELAY_MS = 900;
export const TRICK_HOLD_MS = 1100;
export const CARD_FLY_MS = 350;
export const TRICK_SWEEP_MS = 500;

export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 1000;
