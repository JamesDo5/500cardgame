# Client Sourcecode

## TODOS

### Priority 0: Critical for MVP client
- [x] Implement dealer and dealing.
- [x] Implement dealing player and dealing visually.
- [x] Maybe there should be 15 seconds where someone can press deal during their deal and after that it auto-deals.
- [x] Fix the props I broke for OtherPlayer component
- [x] Player names visually displayed and tracked locally.
- [x] Player names receivable from server.
- [x] Make player's cards a lot bigger, game table smaller
- [x] Cards get smaller when they go to the table. Or maybe everything on the table should be comically large too?
- [x] Score tracking under the hood.
- [x] Score tracking visually.
- [x] Correctly update card arr states when cards move with sortable (this is so the states can be source of truth for blind and card submits)
- [x] Fix bidding to actually operate from callee func
- [x] Move L,T,R bid displays to visually key off of bidbox and not be part of game table
- [x] Re-deal when everyone passes

### Priority 1: Critical for first website release
- [x] Implement flag for dev buttons so the ones that shouldn't show up don't, and they look nice when not in dev mode

### Priority 2p: Important before releasing to public
- [x] Card when dragged is the actual card and not weird globe image-not-found placeholder -- I think this will be done with a div containing each img
- [ ] Need to make a recovery mechanism where if page reloads it asks server to set us back up + our state
- [x] Blind auto-play functionality after timer
- [x] ^Incoming blind should also enforce and detect auto-blind submit
- [x] Incoming trick function should also enforce and detect when we got auto-played.
- [x] Auto-play should play from the client's submit card box first, maybe 10 seconds locally it tries to submit and then at 15 the server auto-plays

### Priority 2a: First order aesthetic concerns
- [x] Shuffle animation between games
- [x] Cards should flip 180 when clicked
- [x] Cards should "breathe"
- [ ] ^ Cards should bounce around slightly in addition to breathing (maybe not tho?)
- [x] Timer should have a cute clock animation, pref a cat clock style
- [x] Little game winner animation or page
- [x] Little trick animation for trick stack addition
- [ ] Hand sort: dealt order is preserved, Sort button sorts trump first then alternating colors and hides after the first card is played. Consider auto-sort preference in a settings menu.
- [ ] Play random button: plays a random legal card from hand.
- [ ] Drag ghost sometimes starts half a card offset from the cursor. Cosmetic, likely the rect being captured mid transition on the hand card.
- [ ] Visually impaired mode setting: each player's most recent card fills their whole side of the table and overlaps their hand area.
- [ ] Won-trick stacks are just a number on a blue block. Make them fun: fanned card backs, a little bounce when one lands, maybe a cat paw dragging them in.
- [x] Make text show for user when they play a card

### Priority 3: Do later
- [ ] There needs to be a mechanism where the server enforces our hand if we mess it up locally somehow so we can keep playing. Maybe a button. Similar but not same as prio2p--page reload
- [x] Investigate breaking up gametable component into multiple components
- [x] Break gametable component into multiple components
- [x] Figure out how to make subcomponents actually work. Had file location errors when first tried
- [x] Move hand to subcomponent
- [ ] Cards should flip 180 and then continue forwards when reclicked
- [x] Move top player code into OtherPlayer.vue
- [ ] Look into making a settings/prefs menu
- [x] Look into style scoping elements that come under a parent purview during code execution in vue. Right now they do not get the scoped component styles.
- [x] Partner jokes when your partner saves you
- [x] Little noise or animation when user tries to do something that's not allowed locally
- [ ] Mark cheaters when user submits card they don't have
- [ ] ^Similar but enforce server state
- [ ] Clients can override server if all of them have different state or card than server
- [x] More strongly define what goes in vuex and what goes in the gameController (winning bid, bidder, etc as key example)

## Layout

- `game/cards.js` card representation, image URLs, mock deal.
- `game/rules.js` pure rules: bid to trump, trick winner, legal plays, scoring, game outcome. No DOM, no store.
- `net/` websocket client, message type constants, server frame handlers. Protocol in `net/PROTOCOL.md`.
- `config.js` standalone flag (`VITE_STANDALONE`), websocket URL (`VITE_WS_URL`).
- Timers: `VITE_TURN_TIMEOUT` and `VITE_DEAL_TIMEOUT` seconds (default 15). Client auto-acts 1s before the deadline, server auto-acts at the deadline. Standalone bots act after 0.9s when Auto bots is on.
- Table is 800x560 anchored 130px from the stage top. Hand cards 140x200, staging card 133x190, table cards 119x170: the card shrinks as it travels from hand to staging to table.
- Stage is 1600x1000 and scales to fit the window. Position new elements relative to the stage.
- Standalone mode shows dev buttons and plays against random legal bots. Set `VITE_STANDALONE=false` once a server drives the clients.

## Notes

`const neededTricks = Math.floor((bb.getHighestBid() + 560) / 100)` is a simplification of 
```
Math.floor( (bb.getHighestBid() - 40) / 100) + 6 )
                   ^             ^       ^      ^
         highest bid          norm  bid2tricks  min tricks
```