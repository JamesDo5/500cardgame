<template>
    <div class="dev-button-container">
        <button class="bid-button dev-button" type="button" id="openBidBoxBtn" style="z-index:100;">Open bid
            table!</button>
        <button class="incoming-bid-button dev-button" type="button" id="incomingBidBtn" style="z-index:100;">Incoming
            bid!</button>
        <button class="bid-button dev-button" type="button" id="submitBidBtn" style="z-index:100;">Submit Bid!</button>
        <button class="blind-button dev-button" type="button" id="incomingBlindBtn" style="z-index:100;">incoming
            blind!</button>
        <button class="play-button dev-button" type="button" id="startPlayBtn" style="z-index:100;">Submit
            blind!</button>
        <button class="discard-blind-button dev-button" type="button" id="blindFinishBtn" style="z-index:100;">Someone
            finished blind!</button>
        <button class="trick-button dev-button" type="button" id="submitTrickBtn" style="z-index:100;">Submit
            card!</button>
        <button class="incoming-trick-button dev-button" type="button" id="incomingTrickBtn" style="z-index:100;">Incoming
            trick!</button>
        <!-- Don't think I need this button v -->
        <button class="game-over-button dev-button" type="button" id="gameOverBtn" style="z-index:100;">Game
            over!</button>
    </div>
</template>

<script setup>
// import { onMounted, ref } from 'vue';
import { useStore } from 'vuex'

const store = useStore();


function startDevButtons() {
    let storedGameTable = store.getters.getGameTable();
    let storedBidBox = store.getters.getBidBox();
    let gameState = store.state.sharedGameState;
    let dealer = store.state.dealer;


    document.getElementById("openBidBoxBtn").addEventListener("click", function () {
        storedBidBox = store.getters.getBidBox();
        gameState = 0;
        // console.log("INFO zIndex:",document.getElementById("bidbox").style.zIndex);

        document.getElementById("bidbox").style.display = document.getElementById("bidbox").style.display === "inline" ? "none" : "inline";
        document.getElementById("bottomBid").style.display = document.getElementById("bottomBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("leftBid").style.display = document.getElementById("leftBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("topBid").style.display = document.getElementById("topBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("rightBid").style.display = document.getElementById("rightBid").style.display === "inline" ? "none" : "inline";

        // For aesthetics the box should go away here. Also, inline-block was necessary for cards to stack horizontally instead of vertically.
        document.getElementById("submitCards").style.display = document.getElementById("submitCards").style.display === "none" ? "flex" : "none";

        storedBidBox.updateBidDisplays();
    });

    document.getElementById("incomingBidBtn").addEventListener("click", function () {
        // v Not necessary yet somehow
        // storedBidBox = store.getters.getBidBox();
        if (store.getters.getDealer() === -1) {
            let inputDealer = parseInt(prompt("Who dealt first?", "0 is you, 1 is left, 2 top, 3 right."));
            for (let i = 0; i < inputDealer+1; i++) {
                store.commit('advanceDealer');
            }
        }
        dealer = store.getters.getDealer();

        let nextBidder = -1;
        // Start at 1 because player after deal bids first
        for (let i = 1; i < 5; i++) {
            if (storedBidBox.bids[(dealer+i)%4] === -1) {
                // console.log("DEBUG incomingBidBtn -- found next bidder:", (dealer+i)%4 );
                nextBidder = (dealer+i)%4;
                break;
            }
        }
        // Check to make sure there's a next bidder and it's not this player
        if (nextBidder === -1) {
            console.log("ERROR incomingBidBtn -- Missed the end of bidding somehow. Everyone bidened but we have incoming bid?")
            return;
        }
        if (nextBidder === 0) {
            console.log("INFO incomingBidBtn -- I'm next bid so this button will do nothing.")
            return;
        }

        // Dispatch a random bid
        let highestBid = Math.max(storedBidBox.getHighestBid(),0);
        if (highestBid === 520) {
            storedBidBox.incomingBid(nextBidder,0);
            return;
        }
        let potentialBids = Array.from({length: (520-highestBid)/20}, (_, i) => (i*20) + highestBid + 20)
        let bid = potentialBids[Math.floor(Math.random() * potentialBids.length)];
        // 0 or 1 times bid to simulate 50% chance of passing
        bid = Math.floor(Math.random() * 2) * bid;
        storedBidBox.incomingBid(nextBidder,bid);
        return;
    });

    document.getElementById("submitBidBtn").addEventListener("click", function () {

        storedBidBox = store.getters.getBidBox();

        storedBidBox.submitBid();

        return;
    });

    document.getElementById("closeBidBox").addEventListener("click", function () {
        document.getElementById("bidbox").style.display = document.getElementById("bidbox").style.display === "inline" ? "none" : "inline";
        document.getElementById("bottomBid").style.display = document.getElementById("bottomBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("leftBid").style.display = document.getElementById("leftBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("topBid").style.display = document.getElementById("topBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("rightBid").style.display = document.getElementById("rightBid").style.display === "inline" ? "none" : "inline";
    });


    document.getElementById("incomingBlindBtn").addEventListener("click", function () {
        // v Why??
        store.getters.getSharedHandCards();
        if (storedGameTable.TESTFUNCswitchBlindFD() === 0) {
            // TODO game state manipulation stuff on success
        }
        if (gameState === 0) {
            gameState = 0;
            // gameTable.renderBlind();
        }
    });

    document.getElementById("startPlayBtn").addEventListener("click", function () {
        if (storedGameTable.submitBlind() === 0) {
            // TODO game state manipulation stuff on success
        }
        if (gameState === 0) {
            gameState = 0;
        }
    });

    document.getElementById("blindFinishBtn").addEventListener("click", function () {
        // CURRENT WIP

        // Blind incoming
        if (! storedGameTable.incomingBlindDiscard() === 0) {
            // TODO whatever happens if it failed
        }
    });

    document.getElementById("submitTrickBtn").addEventListener("click", function () {
        if (storedGameTable.submitTrick() === 0) {
            // TODO game state manipulation stuff on success
        }
        if (gameState === 0) {
            gameState = 0;
        }
    });

    document.getElementById("incomingTrickBtn").addEventListener("click", function () {
        let leader = storedGameTable.lastTrickWinner;
        if (storedGameTable.lastTrickWinner === -1) {
            leader = parseInt(prompt("Who won the bid?", "0 is you, 1 is left, 2 top, 3 right."));
        }
        storedGameTable.lastTrickWinner = leader;

        // Find who plays next in this trick
        let nextPlayer = -1;
        for (let i = 0; i < 4; i++) {
            if (storedGameTable.playedCards[(leader+i)%4] === '') {
                console.log("DEBUG found next player:", (leader+i)%4 );
                nextPlayer = (leader+i)%4;
                break;
            }
            // console.log("DEBUG storedGameTable.playedCards",i,storedGameTable.playedCards[i])
        }
        // Check to make sure there's a next player and it's not this player
        if (nextPlayer === -1) {
            console.log("ERROR Literally me when I missed the end of game somehow. Everyone has played but we have incoming trick!")
            return;
        }
        if (nextPlayer === 0) {
            console.log("INFO I'm next so I'm waiting for my own trick, doing nothing.")
            return;
        }

        // Dispatch a random trick play (4h in this case)
        if (!storedGameTable.incomingTrickCard(nextPlayer, '4', 'h') === 0) {
            // TODO whatever happens if it failed
        }
    });

    document.getElementById("gameOverBtn").addEventListener("click", function () {
        const helloTODO = 1;

        if (storedGameTable.submitTrick() === 0) {
            // TODO game state manipulation stuff on success
        }
        if (gameState === 0) {
            gameState = 0;
        }
    });
}

defineExpose({startDevButtons})

</script>

<style scoped>
.dev-button-container {
    position: absolute;
    top: 0%;
    left: 0%
}

.dev-button {
    position: relative;
    width: 70px;
    height: 50px;
    top: 30px;
    right: -2%;
    padding: 10px 0px;
}
</style>