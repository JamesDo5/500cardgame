import Vuex from 'vuex'

export default new Vuex.Store({
    state: {
        // mapArrIDsTo: new Map([
        //     ["bottomCards", setSharedHandCards],
        //     ["blindCards", "two"],
        //     ["submitCards", "three"],
        // ]),
        // The blind, trick counts, and Xthing are stored as part of the game table
        gameTable: null,
        bidBox: null,
        gameState: -1,
        // Hand structure: ['5s','6c','7h','8d','9d','10d','Jd','Qd','Kd','j']
        handCards: [],
        score: -1,
        winningBid: -1,
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
    },
    getters: {
        // No getters for mapArrIDsTo because it doesn't mutate so can be accessed directly
        // No getters for gameTable nor bidBox because they are object ptrs and react correctly without

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
    }
});
