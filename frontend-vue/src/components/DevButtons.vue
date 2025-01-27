<template>
    <div class="dev-button-container">
        <button class="bid-button dev-button" type="button" id="openBidBoxBtn" style="z-index:100;">Open bid
            table!</button>
        <button class="blind-button dev-button" type="button" id="submitBidBtn" style="z-index:100;">Reveal
            blind!</button>
        <button class="play-button dev-button" type="button" id="startPlayBtn" style="z-index:100;">Submit
            blind!</button>
        <button class="discard-blind-button dev-button" type="button" id="blindFinishBtn" style="z-index:100;">Someone
            finished blind!</button>
        <button class="trick-button dev-button" type="button" id="submitTrickBtn" style="z-index:100;">Submit
            card!</button>
        <button class="incoming-trick-button dev-button" type="button" id="incomingTrickBtn" style="z-index:100;">Advance trick!</button>
        <!-- Don't think I need this button v -->
        <button class="game-over-button dev-button" type="button" id="gameOverBtn" style="z-index:100;">Game
            over!</button>
    </div>
</template>

<script setup>
// import { onMounted, ref } from 'vue';
import { useStore } from 'vuex'
import { updateStandingBid } from './GamePage.vue';

const store = useStore();


function startDevButtons() {
    let storedGameTable = store.state.sharedGameTable;
    let gameState = store.state.sharedGameState;

    document.getElementById("openBidBoxBtn").addEventListener("click", function () {
        gameState = 0;

        document.getElementById("bidbox").style.display = document.getElementById("bidbox").style.display === "inline" ? "none" : "inline";
        document.getElementById("bottomBid").style.display = document.getElementById("bottomBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("leftBid").style.display = document.getElementById("leftBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("topBid").style.display = document.getElementById("topBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("rightBid").style.display = document.getElementById("rightBid").style.display === "inline" ? "none" : "inline";

        // For aesthetics the box should go away here. Also, inline-block was necessary for cards to stack horizontally instead of vertically.
        document.getElementById("submitCards").style.display = document.getElementById("submitCards").style.display === "none" ? "flex" : "none";

        updateStandingBid();
    });

    document.getElementById("closeBidBox").addEventListener("click", function () {
        document.getElementById("bidbox").style.display = document.getElementById("bidbox").style.display === "inline" ? "none" : "inline";
        document.getElementById("bottomBid").style.display = document.getElementById("bottomBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("leftBid").style.display = document.getElementById("leftBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("topBid").style.display = document.getElementById("topBid").style.display === "inline" ? "none" : "inline";
        document.getElementById("rightBid").style.display = document.getElementById("rightBid").style.display === "inline" ? "none" : "inline";
    });


    document.getElementById("submitBidBtn").addEventListener("click", function () {
        if (storedGameTable.renderBlind() === 0) {
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

    document.getElementById("submitTrickBtn").addEventListener("click", function () {
        if (storedGameTable.submitTrick() === 0) {
            // TODO game state manipulation stuff on success
        }
        if (gameState === 0) {
            gameState = 0;
        }
    });

    document.getElementById("incomingTrickBtn").addEventListener("click", function () {
        // TODO this does nothing right now!
        let person = prompt("Who won the last trick?", "0 is you, 1 is to your left");

        lastWinner = Math.floor(Math.random() * 4)
        if (lastWinner === 0) {
            console.log("Waiting for this player")
        } else {
            const helloTODO = 1;
        }

    });

    document.getElementById("blindFinishBtn").addEventListener("click", function () {
        const helloTODO = 1;

        if (storedGameTable.submitTrick() === 0) {
            // TODO game state manipulation stuff on success
        }
        if (gameState === 0) {
            gameState = 0;
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