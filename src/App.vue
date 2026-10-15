<script setup>
import { provide } from 'vue'
import { SUITS, VALUES } from './game/cards.js'
import { layout } from './layout.js'

provide('cardSuits', new Set([...SUITS, 'j']))
provide('cardValues', new Set(VALUES))
</script>

<template>
  <div :class="{ portrait: layout.portrait }">
    <router-view />
  </div>
</template>
