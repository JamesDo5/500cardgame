<template>
    <div class="stateBanner" id="gameState">{{ stateLabel }}</div>
    <Hand />
    <GameTable />
    <BidBox />
    <OtherPlayer playerpos="leftCards" />
    <OtherPlayer playerpos="topCards" />
    <OtherPlayer playerpos="rightCards" />
    <NameBox namepos="nameboxMe" />
    <ActivityFeed />
    <NotifBox />
    <Scoreboard />
    <WinnerScreen />
</template>

<script setup>
import BidBox from './BidBox.vue'
import Hand from './Hand.vue'
import OtherPlayer from './OtherPlayer.vue'
import GameTable from './GameTable.vue'
import NameBox from './NameBox.vue'
import ActivityFeed from './ActivityFeed.vue'
import NotifBox from './NotifBox.vue'
import Scoreboard from './Scoreboard.vue'
import WinnerScreen from './WinnerScreen.vue'

import { computed, onMounted } from 'vue';
import { useStore } from 'vuex'

const store = useStore()

const STATE_LABELS = {
    '-1': 'Waiting for players',
    0: 'Dealing',
    1: 'Bidding',
    2: 'Bidding',
    3: 'Blind exchange',
    4: 'Blind exchange',
    5: 'Playing',
    6: 'Game over',
};
const stateLabel = computed(() => {
    const base = STATE_LABELS[store.state.gameState] ?? `State ${store.state.gameState}`;
    const conn = store.state.connection;
    return conn === 'standalone' ? `${base} (standalone)` : conn === 'open' ? base : `${base} (${conn})`;
});

const emit = defineEmits(['gametable-ready']);
onMounted(() => emit('gametable-ready'));
</script>

<style scoped>
#gameState {
    position: absolute;
    padding: 10px 0px;
    bottom: 215px;
    left: 11px;
    color: white;
    font-family: Arial, sans-serif;
}
</style>
