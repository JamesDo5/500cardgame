# Client Sourcecode

## TODOS

### Priority 0: Critical for MVP client
- [x] Implement dealer and dealing.
- [ ] Implement dealing player and dealing visually.
- [ ] Maybe there should be 15 seconds where someone can press deal during their deal and after that it auto-deals.
- [x] Fix the props I broke for OtherPlayer component
- [x] Player names visually displayed and tracked locally.
- [x] Player names receivable from server.
- [x] Make player's cards a lot bigger, game table smaller
- [x] Cards get smaller when they go to the table. Or maybe everything on the table should be comically large too?
- [ ] Score tracking under the hood.
- [ ] Score tracking visually.
- [x] Correctly update card arr states when cards move with sortable (this is so the states can be source of truth for blind and card submits)
- [x] Fix bidding to actually operate from callee func
- [x] Move L,T,R bid displays to visually key off of bidbox and not be part of game table
- [ ] Re-deal when everyone passes

### Priority 1: Critical for first website release
- [ ] Implement flag for dev buttons so the ones that shouldn't show up don't, and they look nice when not in dev mode

### Priority 2p: Important before releasing to public
- [x] Card when dragged is the actual card and not weird globe image-not-found placeholder -- I think this will be done with a div containing each img
- [ ] Need to make a recovery mechanism where if page reloads it asks server to set us back up + our state
- [ ] Blind auto-play functionality after timer
- [ ] ^Incoming blind should also enforce and detect auto-blind submit
- [ ] Incoming trick function should also enforce and detect when we got auto-played.
- [ ] Auto-play should play from the client's submit card box first, maybe 10 seconds locally it tries to submit and then at 15 the server auto-plays

### Priority 2a: First order aesthetic concerns
- [ ] Shuffle animation between games
- [x] Cards should flip 180 when clicked
- [x] Cards should "breathe"
- [ ] ^ Cards should bounce around slightly in addition to breathing (maybe not tho?)
- [ ] Timer should have a cute clock animation, pref a cat clock style
- [ ] Little game winner animation or page
- [ ] Little trick animation for trick stack addition
- [ ] Make text show for user when they play a card

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
- [ ] Partner jokes when your partner saves you
- [ ] Little noise or animation when user tries to do something that's not allowed locally
- [ ] Mark cheaters when user submits card they don't have
- [ ] ^Similar but enforce server state
- [ ] Clients can override server if all of them have different state or card than server
- [ ] More strongly define what goes in vuex and what goes in the gameController (winning bid, bidder, etc as key example)

## Notes

`const neededTricks = Math.floor((bb.getHighestBid() + 560) / 100)` is a simplification of 
```
Math.floor( (bb.getHighestBid() - 40) / 100) + 6 )
                   ^             ^       ^      ^
         highest bid          norm  bid2tricks  min tricks
```