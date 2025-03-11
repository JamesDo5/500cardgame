<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex'

// playername IS COMPLETELY REDUNDANT, FEEL FREE TO REMOVE IT
const props = defineProps(['namepos', 'playername']);
const store = useStore();

let namepos2playerindex = new Map([
    ['nameboxLeftCards', 1],
    ['nameboxTopCards', 2],
    ['nameboxRightCards', 3],
    ['nameboxMe', 0],
]);

function incomingPlayerName(name) {
    document.getElementById(props.playername).innerHTML = name;
    store.commit('setPlayerName', {'pos':namepos2playerindex.get(props.namepos), 'name':name});
    console.log("INFO incomingPlayerName() -- player at pos",namepos2playerindex.get(props.namepos),"set to name",name,"in state:",store.getters.getPlayerNames);
    return 0;
}

// THE FOLLOWING IS FOR TESTING:
// onMounted(() => {
//     incomingPlayerName("james1");
// });
</script>

<template>
    <div class="namecard-wrapper" :id="namepos">
        <div class="namecard-bg"></div>
        <div class="namecard"></div>
        <div class="player-name" :id="playername">{{ playername }}</div>
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
</style>