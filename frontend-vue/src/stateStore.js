import Vuex from 'vuex'

const FEED_MAX = 30;

export default new Vuex.Store({
    state: {
        gameTable: null,
        bidBox: null,
        hand: null,
        gameState: -1,
        handCards: [],
        winningBid: -1,
        dealer: 0,
        trumpSuit: '',
        playerNames: ['Me', 'Left', 'Top', 'Right'],
        scores: [0, 0],
        handScores: [],
        turn: { pos: -1, deadlineMs: 0 },
        connection: 'standalone',
        notice: '',
        feed: [],
    },
    mutations: {
        setSharedGameTable(state, obj) { state.gameTable = obj; },
        setSharedBidBox(state, obj) { state.bidBox = obj; },
        setSharedHand(state, obj) { state.hand = obj; },
        setGameState(state, n) { state.gameState = n; },
        setSharedHandCards(state, arr) { state.handCards = arr; },
        setWinningBid(state, n) { state.winningBid = n; },
        setDealer(state, n) { state.dealer = n; },
        advanceDealer(state) { state.dealer = (state.dealer + 1) % 4; },
        setTrumpSuit(state, s) { state.trumpSuit = s; },
        setPlayerName(state, { pos, name }) { state.playerNames[pos] = name; },
        addHandScore(state, deltas) {
            state.handScores.push(deltas);
            state.scores = [state.scores[0] + deltas[0], state.scores[1] + deltas[1]];
        },
        setScores(state, { scores, handScores }) {
            state.scores = scores.slice();
            state.handScores = handScores.map(d => d.slice());
        },
        reconcileScores(state, scores) {
            if (!Array.isArray(scores) || scores.length !== 2) return;
            if (scores[0] === state.scores[0] && scores[1] === state.scores[1]) return;
            console.warn('reconcileScores -- server', scores, 'disagrees with client', state.scores, '. Believing server.');
            state.scores = scores.slice();
            if (state.handScores.length) {
                const last = state.handScores[state.handScores.length - 1];
                const prior = [state.scores[0] - last[0], state.scores[1] - last[1]];
                state.handScores[state.handScores.length - 1] = [scores[0] - prior[0], scores[1] - prior[1]];
            }
        },
        resetGame(state) {
            state.scores = [0, 0];
            state.handScores = [];
            state.winningBid = -1;
            state.trumpSuit = '';
            state.turn = { pos: -1, deadlineMs: 0 };
        },
        setTurn(state, turn) { state.turn = turn; },
        setConnection(state, s) { state.connection = s; },
        notify(state, msg) { state.notice = msg; },
        clearNotice(state) { state.notice = ''; },
        feedPush(state, msg) {
            state.feed.push(msg);
            if (state.feed.length > FEED_MAX) state.feed.shift();
        },
    },
    getters: {
        getGameTable: (state) => () => state.gameTable,
        getBidBox: (state) => () => state.bidBox,
        getHand: (state) => () => state.hand,
        getGameState: (state) => () => state.gameState,
        getSharedHandCards: (state) => () => state.handCards,
        getWinningBid: (state) => () => state.winningBid,
        getDealer: (state) => () => state.dealer,
        getTrumpSuit: (state) => () => state.trumpSuit,
        getPlayerNames: (state) => state.playerNames,
        getScores: (state) => state.scores,
    }
});
