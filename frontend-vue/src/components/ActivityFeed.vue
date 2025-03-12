<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex'

// playername IS COMPLETELY REDUNDANT, FEEL FREE TO REMOVE IT
const props = defineProps(['namepos', 'playername']);
const store = useStore();

function incomingPlayerName(name) {
    document.getElementById(props.playername).innerHTML = name;
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
</style>