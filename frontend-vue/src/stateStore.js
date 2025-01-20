import Vuex from 'vuex'

export default new Vuex.Store({
    state: {
        sharedNumber: -1,
        sharedGameTable: null,
        sharedBidBox: null,
        sharedGameState: 0
    },
    mutations: {
        setSharedNumber(state, n) {
            state.sharedNumber = n;
        },
        setSharedGameTable(state, obj) {
            state.sharedGameTable = obj;
        },
        setSharedBidBox(state, obj) {
            state.sharedBidBox = obj;
        },
        setSharedGameState(state, n) {
            state.sharedGameState = n;
        }
    }
});
