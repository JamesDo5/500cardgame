export const STANDALONE = import.meta.env.DEV && import.meta.env.VITE_STANDALONE !== 'false';

export const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000';

export const TURN_TIMEOUT_MS = 1000 * Number(import.meta.env.VITE_TURN_TIMEOUT ?? 15);
export const DEAL_TIMEOUT_MS = 1000 * Number(import.meta.env.VITE_DEAL_TIMEOUT ?? 15);
export const AUTOPLAY_MARGIN_MS = 1000;
export const BOT_DELAY_MS = 900;

export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 1000;
