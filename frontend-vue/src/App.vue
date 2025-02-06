<script setup>
import Websockets from './components/Websockets.vue'
import GamePage from './components/GamePage.vue'
import DevButtons from './components/DevButtons.vue'
import GameController from './components/GameController.vue'
import { ref, provide } from 'vue'


// Bus the game table ready event to siblings
const devButtonsRef = ref(null);
const gameCtlRef = ref(null);
function gameTableIsReady() {
  devButtonsRef.value.startDevButtons();
  gameCtlRef.value.startGameController();
}

// Doing provide/inject instead of state storage for immutable stuff
provide('cardSuits', new Set(['h', 'd', 'c', 's', 'j']))
provide('cardValues', new Set(['4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']))

// TODO CHANGE THIS WITH WEBSOCKET
let ifGame = true;

</script>

<template>
  <Websockets />
  <GamePage v-if="ifGame" />
  <DevButtons v-if="ifGame" ref="devButtonsRef"/>
  <GameController v-if="ifGame" ref="gameCtlRef"/>
</template>

<style scoped>
</style>
