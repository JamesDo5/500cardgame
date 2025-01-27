import Vuex from 'vuex'

export default new Vuex.Store({
    state: {
        // The blind is shared as part of the game table
        sharedGameTable: null,
        sharedBidBox: null,
        sharedGameState: 0,
        sharedHandCards: [],
    },
    mutations: {
        setSharedGameTable(state, obj) {
            state.sharedGameTable = obj;
        },
        setSharedBidBox(state, obj) {
            state.sharedBidBox = obj;
        },
        setSharedGameState(state, n) {
            state.sharedGameState = n;
        },
        setSharedHandCards(state, arr) {
            state.sharedHandCards = arr;
        }
    }
});
