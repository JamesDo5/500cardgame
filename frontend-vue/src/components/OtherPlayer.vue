<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex'
import NameBox from './NameBox.vue'
import { CARD_BACK_URL } from '../game/cards.js'

const props = defineProps(['playerpos']);
const store = useStore();
const nameplate_pos = "namebox" + props.playerpos[0].toUpperCase() + props.playerpos.slice(1);
const posIndex = { leftCards: 1, topCards: 2, rightCards: 3 }[props.playerpos];
const isTop = props.playerpos === "topCards";
const count = computed(() => store.state.cardCounts[posIndex]);
const firstRow = computed(() => Math.min(5, count.value));
const secondRow = computed(() => Math.max(0, count.value - 5));
</script>

<template>
    <div :class="isTop ? 'card-row' : 'card-halfrow'" :id="playerpos">
        <template v-if="isTop">
            <img v-for="n in count" :key="n" class="fake-card card-back" :src="CARD_BACK_URL">
        </template>
        <template v-else>
            <div class="section">
                <img v-for="n in firstRow" :key="n" class="fake-card card-back section-member" :src="CARD_BACK_URL">
            </div>
            <div class="section">
                <img v-for="n in secondRow" :key="n" class="fake-card card-back section-member" :src="CARD_BACK_URL">
            </div>
        </template>
    </div>

    <NameBox :namepos="nameplate_pos" />
</template>

<style scoped>
.card-row {
    position: absolute;
    display: flex;
    gap: 10px;
    min-height: 100px;
}
.card-halfrow {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-height: 205px;
    min-width: 390px;
}

.section {
    display: flex;
    gap: 10px;
    min-height: 100px;
}

#leftCards {
    left: 5px;
    top: 44%;
    transform: translate(0%, -50%);
}
#rightCards {
    right: 5px;
    top: 44%;
    transform: translate(0%, -50%);
    align-items: flex-end;
}
#topCards {
    top: 5px;
    left: 50%;
    transform: translate(-50%, 0%);
}
</style>
