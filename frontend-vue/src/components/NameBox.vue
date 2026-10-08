<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex'

const props = defineProps(['namepos']);
const store = useStore();

const namepos2playerindex = {
    nameboxLeftCards: 1,
    nameboxTopCards: 2,
    nameboxRightCards: 3,
    nameboxMe: 0,
};
const pos = namepos2playerindex[props.namepos] ?? 0;
const name = computed(() => store.state.playerNames[pos]);
const isDealer = computed(() => store.state.dealer === pos);
const isTurn = computed(() => store.state.turn.pos === pos);
</script>

<template>
    <div class="namecard-wrapper" :class="{ dealer: isDealer, turn: isTurn }" :id="namepos">
        <div class="namecard-bg"></div>
        <div class="namecard"></div>
        <div class="player-name">{{ name }}<span v-if="isDealer" class="dealer-chip">D</span></div>
    </div>
</template>

<style scoped>
.namecard-wrapper {
    position: relative;
    display: inline-block;
    z-index: 5;
    transition: all 0.3s ease;
}
.namecard-wrapper:hover {
    transform: scale(1.05);
}
#nameboxLeftCards {
    top: -320px;
    left: 5%;
}
#nameboxTopCards {
    top: -565px;
    left: 30.5%;
}
#nameboxRightCards {
    top: -320px;
    right: -57%;
}
#nameboxMe {
    position: absolute;
    top: 10px;
    right: 100px;
}
#nameboxMe .player-name::before {
    content: '👤';
}

.namecard-bg {
    position: absolute;
    background: linear-gradient(45deg, #3498db, #2ecc71);
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 10px;
    opacity: 0.6;
    transition: opacity 0.3s ease;
    z-index: 0;
}
.namecard-wrapper:hover .namecard-bg {
    opacity: 0.8;
    z-index: 2;
}
.namecard-wrapper.turn .namecard-bg {
    background: linear-gradient(45deg, #f1c40f, #e67e22);
    opacity: 0.9;
}

.namecard {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #2c3e50;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1;
}

.player-name {
    position: relative;
    padding: 12px 24px;
    color: #ecf0f1;
    letter-spacing: 1px;
    font-weight: 600;
    font-family: Arial, sans-serif;
    z-index: 2;
}
.dealer-chip {
    display: inline-block;
    margin-left: 8px;
    padding: 0 7px;
    border-radius: 50%;
    background-color: #ecf0f1;
    color: #2c3e50;
    font-size: 12px;
}
</style>
