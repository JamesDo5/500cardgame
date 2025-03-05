<script setup>
import {onMounted} from 'vue';

const props = defineProps(['namepos']);

onMounted(() => {
    // if (props.namepos !== "nameboxTopCards") {
    //     let el = document.getElementById(props.namepos);
    //     el.
    // }
});
</script>

<template>
    <div class="namecard" :id="namepos">Playername11</div>
</template>

<style scoped>
/* This may look confusing but it's the class on the component */
.namebox {
    /* position: absolute; */
    top: 50%;
    left: 60%;
    /* transform: translate(-50%, -50%) rotate(270deg); */
}

.namecard {
    background-color: #2c3e50;
    color: #ecf0f1;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
    display: inline-block;
    letter-spacing: 1px;
    font-weight: 600;
    transition: all 0.3s ease;
    font-family: Arial, sans-serif;
}

.namecard::before {
    background: linear-gradient(45deg, #3498db, #2ecc71);
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    z-index: -1;
    border-radius: 10px;
    opacity: 0.6;
    transition: opacity 0.3s ease;
}

.namecard:hover {
    transform: scale(1.05);
}

.namecard:hover::before {
    opacity: 0.8;
}

#nameboxLeftCards {
    left: 10px;
    top: 50%;
    transform: translate(-50%, -50%) rotate(270deg);
}
#nameboxRightCards {
    right: 35%;
    top: 50%;
    /* transform: translate(-50%, -50%) rotate(90deg); */
}
</style>