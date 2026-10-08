<script setup>
import GamePage from './components/GamePage.vue'
import DevButtons from './components/DevButtons.vue'
import { ref, provide } from 'vue'
import { useStore } from 'vuex'
import { STANDALONE, WS_URL } from './config.js'
import { socket } from './net/socket.js'
import { installHandlers } from './net/handlers.js'
import { SUITS, VALUES } from './game/cards.js'

provide('cardSuits', new Set([...SUITS, 'j']))
provide('cardValues', new Set(VALUES))

const store = useStore()
const devButtonsRef = ref(null);

function gameTableIsReady() {
  if (STANDALONE) {
    devButtonsRef.value?.startDevButtons();
    return;
  }
  installHandlers(socket, store);
  socket.connect(WS_URL);
}
</script>

<template>
  <GamePage @gametable-ready="gameTableIsReady"/>
  <DevButtons v-if="STANDALONE" ref="devButtonsRef"/>
</template>
