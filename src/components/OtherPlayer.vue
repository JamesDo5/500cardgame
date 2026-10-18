<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex'
import NameBox from './NameBox.vue'
import { cardBackUrl, hiddenHand } from '../game/cards.js'
import { activeTrump } from '../theme.js'

const props = defineProps(['playerpos']);
const store = useStore();
const nameplate_pos = "namebox" + props.playerpos[0].toUpperCase() + props.playerpos.slice(1);
const posIndex = { leftCards: 1, topCards: 2, rightCards: 3 }[props.playerpos];
const isTop = props.playerpos === "topCards";
const cards = computed(() => hiddenHand(store.state.cardCounts[posIndex]));
const backUrl = computed(() => cardBackUrl(activeTrump(store.state)));
const firstRow = computed(() => cards.value.slice(0, 5));
const secondRow = computed(() => cards.value.slice(5));
</script>

<template>
    <div :class="isTop ? 'card-row' : 'card-halfrow'" :id="playerpos">
        <template v-if="isTop">
            <img v-for="(c, n) in cards" :key="n" class="fake-card card-back" draggable="false" :data-card="c" :src="backUrl">
        </template>
        <template v-else>
            <div class="section">
                <img v-for="(c, n) in firstRow" :key="n" class="fake-card card-back section-member" draggable="false" :data-card="c" :src="backUrl">
            </div>
            <div class="section">
                <img v-for="(c, n) in secondRow" :key="n" class="fake-card card-back section-member" draggable="false" :data-card="c" :src="backUrl">
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

.portrait .card-row, .portrait .card-halfrow {
    min-width: 0;
    min-height: 0;
}
.portrait .section, .portrait #topCards > img {
    display: none;
}
.portrait #leftCards {
    left: 90px;
    top: 565px;
}
.portrait #rightCards {
    right: 90px;
    top: 565px;
}
.portrait #topCards {
    top: 240px;
}
</style>
