
export const C2S = Object.freeze({
    JOIN:           'join',
    REQUEST_SYNC:   'requestSync',
    BID:            'bid',
    SUBMIT_BLIND:   'submitBlind',
    PLAY_CARD:      'playCard',
    DEAL:           'deal',
    PING:           'ping',
    REMATCH:        'rematch',
    START_GAME:     'startGame',
    CHANGE_SEAT:    'changeSeat',
    LEAVE:          'leave',
});

export const S2C = Object.freeze({
    WELCOME:        'welcome',
    PLAYER_NAMES:   'playerNames',
    DEAL:           'deal',
    BID:            'bid',
    BIDDING_RESULT: 'biddingResult',
    BLIND:          'blind',
    BLIND_DONE:     'blindDone',
    CARD_PLAYED:    'cardPlayed',
    TRICK_RESULT:   'trickResult',
    HAND_SCORE:     'handScore',
    GAME_OVER:      'gameOver',
    TURN:           'turn',
    SYNC_STATE:     'syncState',
    ERROR:          'error',
    PONG:           'pong',
    REMATCH_COUNTDOWN: 'rematchCountdown',
    LOBBY_STATE:    'lobbyState',
    PLAYER_LEFT:    'playerLeft',
});

export const JOIN_ERROR_CODES = new Set(['NAME_TAKEN', 'UNKNOWN_GAME', 'ROOM_FULL', 'BAD_NAME', 'ROOM_CLOSED', 'NOT_JOINED']);
