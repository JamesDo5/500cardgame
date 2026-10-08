export const STANDALONE = import.meta.env.DEV && import.meta.env.VITE_STANDALONE !== 'false';

export const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000';

export const TURN_TIMEOUT_SECONDS = Number(import.meta.env.VITE_TURN_TIMEOUT ?? 15);
