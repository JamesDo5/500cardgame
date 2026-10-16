<script setup>
import { provide, computed } from 'vue'
import { useStore } from 'vuex'
import { SUITS, VALUES } from './game/cards.js'
import { PORTRAIT_HAND_ROW_CARDS } from './config.js'
import { layout } from './layout.js'

const store = useStore()
const handOneRow = computed(() => {
  const n = store.state.handCards.length
  return layout.portrait && n > 0 && n <= PORTRAIT_HAND_ROW_CARDS
})

provide('cardSuits', new Set([...SUITS, 'j']))
provide('cardValues', new Set(VALUES))
</script>

<template>
  <div :class="{ portrait: layout.portrait, 'hand-one-row': handOneRow }">
    <router-view />
  </div>
</template>
