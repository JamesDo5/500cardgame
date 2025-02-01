import Vuex from 'vuex'

export default new Vuex.Store({
    state: {
        // mapArrIDsTo: new Map([
        //     ["bottomCards", setSharedHandCards],
        //     ["blindCards", "two"],
        //     ["submitCards", "three"],
        // ]),
        // The blind, trick counts, and Xthing are stored as part of the game table.
        gameTable: null,
        bidBox: null,
        // -1:uninitialized, 0:dealing/shuffling, 1:hands dealt, 2:bids submitted, 3:blind dealt, 4:blind submitted, 5:trick play, 6:game over
        // There is a state between 1 and 2 where the global state hasnt changed but locally we have submitted bid
        // 2 and 3 are the same
        // There is a state between 3 and 4 where the global state hasnt changed but locally we have submitted blind
        // 4 and 5 are the same
        // state V2: -1:uninitialized, 0:dealing/shuffling, 1:hands dealt, 2:I bid, 3:all bids in, blind dealt, 4:I submitted blind, 5:trick play, 6:game over
        // With this setup, the server never uses states 2 or 4
        gameState: -1,
        // Hand structure: ['5s','6c','7h','8d','9d','10d','Jd','Qd','Kd','j']
        handCards: [],
        score: -1,
        winningBid: -1,
        dealer: -1,
    },
    mutations: {
        setSharedGameTable(state, obj) {
            state.gameTable = obj;
        },
        setSharedBidBox(state, obj) {
            state.bidBox = obj;
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
    },
    getters: {
        // No getters for mapArrIDsTo because it doesn't mutate so can be accessed directly
        // No getters for gameTable nor bidBox because they are object ptrs and react correctly without
        getGameTable: (state) => () => {
            return state.gameTable;
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
    }
});
