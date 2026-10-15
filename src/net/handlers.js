import { S2C, JOIN_ERROR_CODES } from './messages.js';
import { saveToken } from '../session.js';
import { isValidCardStr } from '../game/cards.js';

export function installHandlers(socket, store) {
    const gt = () => store.getters.getGameTable();
    const bb = () => store.getters.getBidBox();
    const hand = () => store.getters.getHand();

    socket.onStatus = (status) => {
        store.commit('setConnection', status);
    };

    socket
        .on(S2C.WELCOME, ({ seat, playerNames, gameId, playerToken }) => {
            setNames(store, playerNames);
            store.commit('setSession', { gameId, seat, token: playerToken });
            store.commit('setJoinError', '');
            if (gameId && playerToken) saveToken(gameId, playerToken);
        })
        .on(S2C.LOBBY_STATE, (lobby) => {
            store.commit('setLobby', lobby);
            if (lobby.pace) store.commit('setPace', lobby.pace);
            if (Array.isArray(lobby.seats)) setNames(store, lobby.seats.map(seat => seat.name));
        })
        .on(S2C.PACE_CHANGED, ({ pace, by }) => {
            if (!pace) return;
            store.commit('setPace', pace);
            const who = by === 0 ? 'You' : store.state.playerNames[by] ?? 'Someone';
            store.commit('notify', `${who} set ${pace} pace.`);
            store.commit('feedPush', `${who} set ${pace} pace.`);
        })
        .on(S2C.REMATCH_COUNTDOWN, ({ startsAtMs }) => store.commit('setRematchAt', startsAtMs))
        .on(S2C.PLAYER_LEFT, ({ pos, name, abandoned }) => {
            store.commit('feedPush', `${name ?? store.state.playerNames[pos]} left${abandoned ? ' and the game was abandoned' : ''}.`);
            store.commit('notify', abandoned ? `${name} left. Back to the lobby.` : `${name} left.`);
        })
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
            if (JOIN_ERROR_CODES.has(code)) {
                store.commit('setJoinError', message ?? code);
                socket.close();
                return;
            }
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
    if (snap.pace) store.commit('setPace', snap.pace);
    store.commit('setDealer', snap.dealer);
    store.commit('setScores', { scores: snap.scores ?? [0, 0], handScores: snap.handScores ?? [] });
    bb.reset();
    gt.newHand();
    if (Array.isArray(snap.hand)) hand.replaceHand(snap.hand);
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
    if (store.state.gameState === 6) store.commit('setGameWinner', snap.winnerTeam ?? -1);
    if (store.state.gameState === 1 || store.state.gameState === 2) bb.show(); else bb.hide();
}
