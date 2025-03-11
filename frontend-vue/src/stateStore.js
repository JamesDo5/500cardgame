import Vuex from 'vuex'

export default new Vuex.Store({
    state: {
        // The blind, trick counts, and Xthing are stored as part of the game table.
        gameTable: null,
        bidBox: null,
        // Game controller's scope is everything outside the hand level. Interhand things like score and game-over screen.
        gameCtlr: null,
        // states -1:uninitialized, 0:dealing/shuffling, 1:hand dealt, 2:I bid, 3:all bids in, blind dealt, 4:I submitted blind, 5:trick play, 6:game over
        // With this setup, the server never uses states 2 or 4, but client can
        gameState: -1,
        // Hand has card objects: [{v:5,s:s},{v:6,s:c},{v:7,s:h},{v:8,s:d},{v:9,s:d},{v:10,s:d},{v:J,s:d},{v:Q,s:d},{v:K,s:d},{v:'',s:d}]
        handCards: [],
        score: -1,
        winningBid: -1,
        dealer: Math.floor(Math.random() * 4),
        // s, c, d, h, n
        trumpSuit: '',
        // 4 strings, index 0 is my name
        playerNames: ['', '', '', ''],
    },
    mutations: {
        setSharedGameTable(state, obj) {
            state.gameTable = obj;
        },
        setSharedBidBox(state, obj) {
            state.bidBox = obj;
        },
        setGameCtlr(state, obj) {
            state.gameCtlr = obj;
        },
        setGameState(state, n) {
            state.gameState = n;
        },
        setSharedHandCards(state, arr) {
            state.handCards = arr;
        },
        setScore(state, n) {
            state.score = n;
        },
        setWinningBid(state, n) {
            state.winningBid = n;
        },
        advanceDealer(state) {
            state.dealer = (state.dealer+1)%4;
        },
        setTrumpSuit(state, s) {
            state.trumpSuit = s;
        },
        setPlayerName(state, payload) {
            state.playerNames[payload.pos] = payload.name;
        },
    },
    getters: {
        // No getters for gameTable nor bidBox because they are object ptrs and react correctly without
        // ^^ JUST KIDDING
        getGameTable: (state) => () => {
            return state.gameTable;
        },
        getBidBox: (state) => () => {
            return state.bidBox;
        },
        getGameCtlr: (state) => () => {
            return state.gameCtlr;
        },
        getGameState: (state) => () => {
            return state.gameState;
        },
        getSharedHandCards: (state) => () => {
            return state.handCards;
        },
        getScore: (state) => () => {
            return state.score;
        },
        getWinningBid: (state) => () => {
            return state.winningBid;
        },
        getDealer: (state) => () => {
            return state.dealer;
        },
        getTrumpSuit: (state) => () => {
            return state.trumpSuit;
        },
        getPlayerNames(state) {
            return state.playerNames;
        },
    }
});
