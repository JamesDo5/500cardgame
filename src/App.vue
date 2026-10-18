<script setup>
import { provide, computed, watchEffect } from 'vue'
import { useStore } from 'vuex'
import { SUITS, VALUES, applyCardArt } from './game/cards.js'
import { layout } from './layout.js'
import { activeTrump, applyTrumpTheme } from './theme.js'

const store = useStore()

provide('cardSuits', new Set([...SUITS, 'j']))
provide('cardValues', new Set(VALUES))

const trump = computed(() => activeTrump(store.state))
const themeLevel = computed(() => store.state.themeLevel)
watchEffect(() => applyTrumpTheme(trump.value, themeLevel.value))
watchEffect(() => applyCardArt(store.state.cardArt))
</script>

<template>
  <div :class="{ portrait: layout.portrait }" :data-trump="trump || null" :data-theme-level="trump ? themeLevel : null">
    <router-view />
  </div>
</template>
