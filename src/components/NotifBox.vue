<script setup>
import { computed, watch } from 'vue';
import { useStore } from 'vuex'
import { isFlavorLine } from '../flavor.js';

const store = useStore();
const notice = computed(() => store.state.notice);
let timer = null;

watch(notice, (msg) => {
    clearTimeout(timer);
    if (msg) timer = setTimeout(() => store.commit('clearNotice'), 3000);
});
</script>

<template>
    <Transition name="notif">
        <div v-if="notice" class="notif-box" :class="{ flavor: isFlavorLine(notice) }">{{ notice }}</div>
    </Transition>
</template>

<style scoped>
.notif-box {
    position: absolute;
    top: 18%;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--ivory);
    color: var(--ink);
    border: 2px solid var(--ink);
    outline: 2px solid var(--gold);
    padding: 12px 24px;
    border-radius: 0;
    font-family: Arial, sans-serif;
    font-size: 26px;
    z-index: 50;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}
.notif-box.flavor {
    font-style: italic;
}
.portrait .notif-box {
    top: 332px;
    font-size: 20px;
}
.notif-enter-active, .notif-leave-active {
    transition: opacity 0.3s, transform 0.3s;
}
.notif-enter-from, .notif-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
}
</style>
