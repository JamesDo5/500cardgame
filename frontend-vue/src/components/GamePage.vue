<template>
    <div class="stateBanner" id="gameState">Current_Game_State</div>
    <div class="standing-bid-display" id="finalBidDisplay" style="color:white;">Standing Bid: 000</div>
    <Hand @hand-ready="handIsReady"/>
    <BidBox />
    <OtherPlayer playerLR="leftCards"/>
    <OtherPlayer playerLR="rightCards"/>'
    <GameTable @gametable-ready="gameTableIsReady"/>
</template>

<script setup>
import BidBox from './BidBox.vue'
import Hand from './Hand.vue'
import OtherPlayer from './OtherPlayer.vue'
import GameTable from './components/GameTable.vue'

import { onMounted } from 'vue';
import { useStore } from 'vuex'

const store = useStore()
let gameState = store.state.sharedGameState; //-1:uninitialized, 0:dealing/shuffling, 1:hands dealt, 2:I bid, 3:all bids in, blind dealt, 4:I submitted blind, 5:trick play, 6:game over

function renderNewGameState() {
    gameState = store.getters.getGameState();
    document.getElementById("gameState").innerHTML = "Current_Game_State: ".concat(gameState);

    // TODO Maybe display to players a little box of what's going on
}

function handIsReady() {
}

onMounted(() => {
    renderNewGameState();
});
</script>

<style scoped>
.game-table-container {
  position: relative;
  width: 1000px;
  height: 800px;
  display: flex;
  justify-content: center;
  align-items: center;
}
#gameState {
  position: absolute;
  padding: 10px 0px;
  top: 10px;
  left: 11px;
  color: white
}
</style>