<script setup>
import GamePage from './GamePage.vue'
import GameTable from './GameTable.vue'
import DevButtons from './DevButtons.vue'
import { ref } from 'vue'


// Bus the game table ready event to siblings
const devButtonsRef = ref(null);
function gameTableIsReady() {
  devButtonsRef.value.startDevButtons();
}
</script>

<template>
  <GamePage />
  <GameTable @gametable-ready="gameTableIsReady"/>
  <DevButtons ref="devButtonsRef"/>
</template>
