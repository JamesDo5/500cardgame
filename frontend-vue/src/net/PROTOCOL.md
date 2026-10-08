# Client/server websocket protocol

Every frame is JSON: `{ "type": string, "payload": object, "seq": number }`. `seq` is a per-direction
monotonic counter. On a gap the client sends `requestSync` and applies the resulting `syncState`.

All positions in payloads are relative to the receiving client: 0 me, 1 left, 2 top, 3 right.
The server knows each socket's seat and rotates before sending. Teams are `pos % 2`.
Cards are strings: `Jd`, `10s`, `j` (joker). Scores are full scale (6 spades is 40, each
opponent trick is 10). Bids are 0 for pass or a multiple of 20 from 40 to 520.

## Client to server

| type | payload | when |
|---|---|---|
| `join` | `{ gameId, playerName }` | on connect |
| `requestSync` | `{}` | on connect, on seq gap, on page reload |
| `bid` | `{ bid }` | player submits a bid |
| `submitBlind` | `{ discards: [5 cards] }` | bid winner finishes exchanging with the blind |
| `playCard` | `{ card }` | player submits a card |
| `deal` | `{}` | dealer presses deal before the auto-deal timer |
| `ping` | `{}` | every 20s heartbeat |

## Server to client

| type | payload | client effect |
|---|---|---|
| `welcome` | `{ seat, playerNames, gameId }` | sets names |
| `playerNames` | `{ playerNames }` | sets names |
| `deal` | `{ dealer, hand: [10 cards] }` | resets table and bid box, renders hand, state 1, opens bid box |
| `bid` | `{ pos, bid }` | records and displays a bid |
| `biddingResult` | `{ winner, bid, trump }` or `{ redeal: true }` | state 3, or state 0 and wait for next `deal` |
| `blind` | `{ cards: [5 cards] }` | only to bid winner; renders blind face down |
| `blindDone` | `{ pos }` | hides blind, shows discard stack, enables submit box, state 5 |
| `cardPlayed` | `{ pos, card, auto }` | renders card, client predicts trick winner at 4th card |
| `trickResult` | `{ winner }` | reconciles with client prediction, overwrites if different |
| `handScore` | `{ deltas, scores }` | reconciles scores, overwrites if different |
| `gameOver` | `{ winnerTeam, scores }` | state 6 |
| `turn` | `{ pos, deadlineMs }` | whose action is awaited and the server autoplay deadline |
| `syncState` | snapshot below | full restore |
| `error` | `{ code, message }` | shown in the notice box |
| `pong` | `{}` | ignored |

## syncState snapshot

```
{
  gameState, dealer, playerNames, scores, handScores,
  hand, bids, trump, winningBid, bidWinner,
  blind,            // null unless this client holds it
  blindDone,        // bool
  playedCards,      // 4 slots, '' when empty
  leader, wonTricks, // per position
  turn: { pos, deadlineMs }
}
```

## Prediction and reconciliation

The client computes trick winner and hand score locally the instant the last card lands so animation
can start immediately. `trickResult` and `handScore` from the server are compared against the prediction
and overwrite it when they disagree. Follow-suit is enforced on both sides.
