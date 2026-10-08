# 500 server contract

What the Vue client in `frontend-vue/` expects from the game server. The client code that implements this side
lives in `frontend-vue/src/net/` (`messages.js` for type constants, `socket.js` for the transport,
`handlers.js` for what each inbound frame does). Rules the client assumes are in `frontend-vue/src/game/rules.js`
and the server must agree with them exactly, since the client predicts outcomes and only reconciles on disagreement.

## 1. Transport

- One WebSocket per client. Default URL `ws://localhost:3000`, overridable with `VITE_WS_URL`.
- Every frame in either direction is a single JSON object: `{ "type": string, "payload": object, "seq": number }`.
- `seq` is a per-direction counter starting at 0, incremented by 1 per frame. The client checks inbound `seq` for
  gaps and sends `requestSync` when it sees one. The server should do the same with client frames.
- Client sends `ping` every 20 seconds while connected. Server replies `pong`. Either side may close an idle socket.
- On disconnect the client reconnects with exponential backoff (0.5s doubling to 15s, with jitter). Frames the client
  tried to send while disconnected are queued and flushed in order after reconnect.
- On every (re)connect the client immediately sends `requestSync`. The server must answer with `syncState`
  regardless of game phase.
- Unknown inbound types are logged and ignored, so additive protocol changes are safe.

## 2. Conventions

- **Positions are relative to the receiving client.** 0 is the recipient, 1 is the player to their left, 2 is their
  partner across, 3 is to their right. The server knows each socket's seat and rotates every position before sending.
  The client never learns absolute seat numbers and does not need to.
- **Teams** are `pos % 2`. Team 0 is the recipient and partner, team 1 is the opponents. Score arrays are `[team0, team1]`
  from the recipient's point of view, so the server rotates those too.
- **Cards** are strings: value then suit, `4s` through `As`, `10d`, `Jc`, joker is `j`. Valid values are
  4 5 6 7 8 9 10 J Q K A. Deck is 45 cards: 4 through A in four suits plus one joker.
- **Hidden cards** the recipient is not allowed to see are sent as `?`. Opponents' hands in a snapshot are arrays of `?`
  of the right length. Never send real values for other players' hands or the blind to a non-holder.
- **Bids** are `0` for pass or a multiple of 20 from 40 to 520. Bid to suit: 40 60 80 100 120 are 6 spades, 6 clubs,
  6 diamonds, 6 hearts, 6 no trump, then each 100 adds a trick. Trump suit letters are `s c d h` and `n` for no trump.
- **Scores** are full scale: a 6 spades contract is worth 40, each opponent trick is 10.
- **Timestamps** are Unix milliseconds. Client clocks may be off by a few seconds; see timers below.

## 3. Game flow and state numbers

The client tracks `gameState`:

| value | meaning |
|---|---|
| -1 | not in a game / waiting for players |
| 0 | between hands, dealer has not dealt |
| 1 | bidding |
| 2 | client-only: I have bid, waiting for others |
| 3 | bidding settled, bid winner is exchanging with the blind |
| 4 | client-only: I submitted my blind, waiting for server |
| 5 | trick play |
| 6 | game over |

Server only ever needs to express -1, 0, 1, 3, 5, 6 in `syncState.gameState`.

Sequence for one hand:

1. Server sends `turn` for the dealer with the deal deadline. Dealer may send `deal` early. At the deadline the
   server deals anyway.
2. Server sends `deal` to each player with their own 10 cards. Five cards are held back as the blind.
3. Bidding is one round. Player left of dealer bids first, dealer last. Each `bid` is broadcast as `bid`.
   A bid must be pass or strictly higher than the standing bid. After four bids the server sends `biddingResult`.
   If all four passed, `biddingResult` is `{ redeal: true }`, the same dealer deals again, and the flow restarts at step 1.
4. Server sends `blind` with the five cards to the bid winner only. The winner takes them into hand and sends
   `submitBlind` with exactly five discards from their 15 cards. Server broadcasts `blindDone`. The discards are never
   shown to anyone and the bid winner leads the first trick.
5. Trick play. Server sends `turn` for the leader. Each `playCard` is validated and broadcast as `cardPlayed`.
   After the fourth card the server sends `trickResult`. The winner leads the next trick.
6. After ten tricks the server sends `handScore`. If the game is not over, dealer advances one seat to the left and
   the flow restarts at step 1. Otherwise `gameOver`.

## 4. Client to server frames

| type | payload | notes |
|---|---|---|
| `join` | `{ gameId, playerName }` | sent once after `welcome` is not yet received; server assigns a seat |
| `requestSync` | `{}` | server replies with `syncState` |
| `deal` | `{}` | only valid from the dealer in state 0 |
| `bid` | `{ bid }` | only valid from the player whose bid it is |
| `submitBlind` | `{ discards: [5 cards] }` | only valid from the bid winner in state 3; all five must be from their 15 cards |
| `playCard` | `{ card }` | only valid from the player whose turn it is; must be in their hand and legal |
| `ping` | `{}` | heartbeat |

Invalid frames should get an `error` reply and must not change state. The client keeps its optimistic local change
until a `syncState` or the authoritative event arrives, so after rejecting a frame the server should send `syncState`
to that client so it snaps back.

## 5. Server to client frames

| type | payload | client reaction |
|---|---|---|
| `welcome` | `{ seat, playerNames: [4], gameId }` | records names; seat is informational only |
| `playerNames` | `{ playerNames: [4] }` | updates nameplates, index 0 is the recipient |
| `turn` | `{ pos, deadlineMs }` | sets whose action is awaited and the server deadline; drives timers |
| `deal` | `{ dealer, hand: [10 cards] }` | resets table, renders hand, opens bid box, state 1 |
| `bid` | `{ pos, bid }` | records and displays; client re-derives the next bidder |
| `biddingResult` | `{ winner, bid, trump }` or `{ redeal: true }` | state 3 or state 0; client already predicted this and only acts if it disagrees |
| `blind` | `{ cards: [5 cards] }` | only to bid winner; renders face down, winner flips it |
| `blindDone` | `{ pos }` | hides blind, shows discard stack beside `pos`, enables play box, state 5 |
| `cardPlayed` | `{ pos, card, auto }` | renders the card; `auto` true means the server played it on timeout |
| `trickResult` | `{ winner }` | reconciles with the client prediction |
| `handScore` | `{ deltas: [2], scores: [2] }` | reconciles with the client prediction |
| `gameOver` | `{ winnerTeam, scores: [2] }` | state 6, winner screen |
| `syncState` | snapshot below | full restore |
| `error` | `{ code, message }` | shown to the player as a notice |
| `pong` | `{}` | ignored |

`cardPlayed` and `bid` are broadcast to all four players including the actor. The client treats an echo of its own
action as idempotent: a card or bid already recorded for that position is a no-op.

## 6. Snapshot shape for `syncState`

```
{
  gameState,               // see table above
  dealer,                  // relative pos
  playerNames,             // [4], index 0 is recipient
  scores,                  // [team0, team1]
  handScores,              // [[d0, d1], ...] one per completed hand this game
  hand,                    // recipient's cards, [] if none
  hands,                   // [4] arrays; index 0 real, others all '?'
  bids,                    // [4], -1 not yet bid, 0 pass, else bid value
  trump,                   // 's' 'c' 'd' 'h' 'n' or '' before bidding settles
  winningBid,              // bid value or -1
  bidWinner,               // relative pos or -1
  blind,                   // 5 cards if recipient holds the blind in state 3, else null
  blindDone,               // true once discards were accepted this hand
  playedCards,             // [4] current trick, '' for not yet played
  leader,                  // relative pos who led the current trick, -1 if none
  wonTricks,               // [4] tricks won per position this hand
  turn: { pos, deadlineMs }
}
```

The client applies a snapshot destructively: it resets the table and bid box, then rebuilds from these fields.
Send the snapshot on connect, on any rejected client frame, and whenever the server detects the client is out of sync.

## 7. Rules the server must enforce identically

The client enforces these locally for UX, so disagreement produces visible glitches. They match `rules.js`.

- Deck 45 cards, 10 each, 5 blind. Bid winner takes the blind and discards 5, so hands are always 10 at trick start.
- One round of bidding. Pass is 0. Any bid must beat the standing bid. All pass means same dealer redeals.
- Trump ranking: joker highest, then right bower (jack of trump), left bower (jack of same colour), then A K Q 10 9 .. 4.
  In no trump the joker is the only trump and jacks are ordinary.
- Joker is always a trump card. Leading the joker leads the trump suit. In no trump, leading the joker means the joker
  wins and others may play anything.
- Follow suit is mandatory when possible, counting bowers and joker as trump suit. If trump is led and a player's only
  trump is the joker or a bower, they must play it. A player void in the led suit may play anything.
- Trick winner: highest trump if any trump was played, else highest card of the led suit.
- Scoring per hand: bidding team gets the bid value if they took at least the contracted tricks, otherwise minus the
  bid value. Opponents get 10 per trick they took regardless. Taking all 10 tricks on a bid under 250 scores 250
  instead of the bid value.
- Game ends when a team reaches 500 or falls to -500. If both teams cross 500 on the same hand, the bidding team wins
  if they made their contract, otherwise the other team. A team at -500 or below loses immediately.
- Bid winner leads the first trick. Trick winner leads the next.

## 8. Timers and autoplay

- Deadlines are absolute `deadlineMs` in the `turn` frame. Client defaults when the server has not sent one are
  45s to bid, 45s to exchange the blind, 30s to play, 15s for the dealer to deal.
- The client acts for its own player one second before the deadline, so the server should treat an action that arrives
  at or before the deadline as on time. Keep at least a one second grace window after the deadline for network latency
  before the server autoplays.
- Server autoplay rules, to match what the client does and shows:
  - Bid: submit the player's highlighted bid if legal, otherwise pass. The server cannot see the highlight, so pass.
  - Blind: discard whatever is in the player's blind box. Server cannot see that either, so discard the five lowest
    cards by face value in suit order spades, clubs, diamonds, hearts, joker last. Cards equal in value tie-break by that
    suit order, so 4♠ 4♣ 4♦ 4♥ 5♠.
  - Play: the lowest legal card by the same ordering.
- Server-played actions arrive as normal `cardPlayed` with `auto: true`. A server-forced blind arrives as `blindDone`.
- The client always shows a countdown and acts first, so in the normal case the server never has to autoplay a
  connected client. Autoplay on the server matters for disconnected or frozen clients.

## 9. Prediction and reconciliation

The client computes the trick winner, the bidding result, and the hand score locally the instant the last input lands
so animation can start without a round trip. Server frames `trickResult`, `biddingResult`, and `handScore` are compared
to the prediction and only applied when they differ, with a console warning. For this to be invisible the server must
implement section 7 exactly. The server is always authoritative; the client never argues.

## 10. Lobby and identity

Not designed yet on the client side. Current expectation is minimal:

- Client connects, sends `join` with a game id from the URL or a lobby, server assigns a seat and replies `welcome`.
- Reconnecting with the same identity resumes the same seat. How identity is carried (cookie, token in `join`,
  query string on the socket URL) is the server's choice; the client will send whatever the server needs in `join`.
- A seat that is empty should still have a name so the table renders. Use something like `Empty seat`.

## 11. Open questions for the server author

- Whether the server echoes a player's own `bid` and `cardPlayed` back to them. The client handles both ways.
- Whether `blind` should also go to spectators with `?` values. Client currently has no spectator mode.
- Whether to send `turn` after every action or only when the actor changes. Client handles both.
- Format of `error.code`. Client only displays `message`.
