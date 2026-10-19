<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { useStore } from 'vuex'
import { isFlavorLine } from '../flavor.js';

const store = useStore();
const feed = computed(() => store.state.feed);
const listRef = ref(null);

watch(() => feed.value.length, async () => {
    await nextTick();
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
});
</script>

<template>
    <div class="activity-feed" ref="listRef">
        <div v-for="(msg, i) in feed" :key="i" class="feed-line" :class="{ flavor: isFlavorLine(msg) }">{{ msg }}</div>
    </div>
</template>

<style scoped>
.activity-feed {
    position: absolute;
    right: 20px;
    bottom: 275px;
    width: 290px;
    max-height: 160px;
    overflow-y: auto;
    color: var(--muted);
    font-family: Arial, sans-serif;
    font-size: 16px;
    background-color: rgba(0, 0, 0, 0.3);
    border-left: 2px solid var(--gold-deep);
    border-radius: 0;
    padding: 8px;
}
.feed-line {
    padding: 2px 0;
}
.feed-line.flavor {
    font-style: italic;
}

.portrait .activity-feed {
    right: auto;
    left: 250px;
    bottom: 565px;
    width: 330px;
    max-height: 70px;
    font-size: 13px;
}
</style>
