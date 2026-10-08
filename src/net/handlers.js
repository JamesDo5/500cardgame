import { S2C, C2S } from './messages.js';
import { isValidCardStr } from '../game/cards.js';

export function installHandlers(socket, store) {
    const gt = () => store.getters.getGameTable();
    const bb = () => store.getters.getBidBox();
    const hand = () => store.getters.getHand();

    socket.onStatus = (status) => {
        store.commit('setConnection', status);
        if (status === 'open') socket.send(C2S.REQUEST_SYNC);
    };

    socket
        .on(S2C.WELCOME, ({ playerNames }) => setNames(store, playerNames))
        .on(S2C.PLAYER_NAMES, ({ playerNames }) => setNames(store, playerNames))
        .on(S2C.DEAL, ({ dealer, hand: cards }) => {
            if (!Array.isArray(cards) || cards.length !== 10 || !cards.every(isValidCardStr)) {
                console.error('deal -- bad hand from server:', cards);
                return;
            }
            store.commit('setDealer', dealer);
            gt().newHand();
            bb().reset();
            hand().incomingHandCards(cards);
            gt().startBidding();
        })
        .on(S2C.BID, ({ pos, bid }) => bb().incomingBid(pos, bid))
        .on(S2C.BIDDING_RESULT, (p) => bb().incomingBiddingResult(p))
        .on(S2C.BLIND, ({ cards }) => gt().incomingBlind(cards, true))
        .on(S2C.BLIND_DONE, ({ pos }) => gt().incomingBlindDiscard(pos))
        .on(S2C.CARD_PLAYED, ({ pos, card, auto }) => gt().incomingTrickCard(pos, card, auto))
        .on(S2C.TRICK_RESULT, ({ winner }) => gt().reconcileTrickWinner(winner))
        .on(S2C.HAND_SCORE, ({ scores }) => store.commit('reconcileScores', scores))
        .on(S2C.GAME_OVER, ({ winnerTeam, scores }) => {
            store.commit('reconcileScores', scores);
            gt().endGame(winnerTeam);
        })
        .on(S2C.TURN, ({ pos, deadlineMs }) => store.commit('setTurn', { pos, deadlineMs }))
        .on(S2C.SYNC_STATE, (snap) => applySnapshot(store, snap))
        .on(S2C.ERROR, ({ code, message }) => {
            console.error('server error', code, message);
            store.commit('notify', message ?? code);
        });
}

function setNames(store, names) {
    if (!Array.isArray(names)) return;
    names.forEach((name, pos) => store.commit('setPlayerName', { pos, name }));
}

function applySnapshot(store, snap) {
    const gt = store.getters.getGameTable();
    const bb = store.getters.getBidBox();
    const hand = store.getters.getHand();
    setNames(store, snap.playerNames);
    store.commit('setDealer', snap.dealer);
    store.commit('setScores', { scores: snap.scores ?? [0, 0], handScores: snap.handScores ?? [] });
    bb.reset();
    gt.newHand();
    if (Array.isArray(snap.hand)) hand.incomingHandCards(snap.hand);
    if (Array.isArray(snap.bids)) bb.bids = snap.bids.slice();
    if (snap.trump) store.commit('setTrumpSuit', snap.trump);
    if (Number.isInteger(snap.winningBid)) store.commit('setWinningBid', snap.winningBid);
    if (Number.isInteger(snap.bidWinner)) { bb.winningBidder = snap.bidWinner; bb.winningBidTeam = snap.bidWinner % 2; }
    bb.updateBidDisplays();
    if (Array.isArray(snap.blind)) gt.incomingBlind(snap.blind, false);
    if (snap.blindDone && Number.isInteger(snap.bidWinner)) gt.incomingBlindDiscard(snap.bidWinner);
    if (Array.isArray(snap.playedCards)) gt.restoreTrick(snap.playedCards, snap.leader, snap.wonTricks);
    if (snap.turn) store.commit('setTurn', snap.turn);
    store.commit('setGameState', snap.gameState ?? -1);
    if (store.state.gameState === 1 || store.state.gameState === 2) bb.show(); else bb.hide();
}
