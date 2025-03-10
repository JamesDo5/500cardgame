<script setup>
import { onMounted } from 'vue';

const props = defineProps(['namepos', 'playername']);

onMounted(() => {
    // if (props.namepos !== "nameboxTopCards") {
    //     let el = document.getElementById(props.namepos);
    //     el.
    // }
});
</script>

<template>
    <div class="namecard-wrapper" :id="namepos">
        <div class="namecard-bg"></div>
        <div class="namecard"></div>
        <div class="player-name">{{ playername }}</div>
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