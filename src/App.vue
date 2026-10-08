<script setup>
import GamePage from './components/GamePage.vue'
import DevButtons from './components/DevButtons.vue'
import { ref, provide, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { STANDALONE, WS_URL, STAGE_WIDTH, STAGE_HEIGHT } from './config.js'
import { socket } from './net/socket.js'
import { installHandlers } from './net/handlers.js'
import { SUITS, VALUES } from './game/cards.js'

provide('cardSuits', new Set([...SUITS, 'j']))
provide('cardValues', new Set(VALUES))

const store = useStore()
const devButtonsRef = ref(null);
const stageStyle = ref({});

function fitStage() {
  const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
  stageStyle.value = {
    width: `${STAGE_WIDTH}px`,
    height: `${STAGE_HEIGHT}px`,
    left: `${(window.innerWidth - STAGE_WIDTH * scale) / 2}px`,
    top: `${(window.innerHeight - STAGE_HEIGHT * scale) / 2}px`,
    transform: `scale(${scale})`,
  };
}
fitStage();
onMounted(() => window.addEventListener('resize', fitStage));
onBeforeUnmount(() => window.removeEventListener('resize', fitStage));

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
  <div id="stage" :style="stageStyle">
    <GamePage @gametable-ready="gameTableIsReady"/>
    <DevButtons v-if="STANDALONE" ref="devButtonsRef"/>
  </div>
</template>
