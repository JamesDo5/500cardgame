<script setup>
import { provide } from 'vue'
import { SUITS, VALUES } from './game/cards.js'

provide('cardSuits', new Set([...SUITS, 'j']))
provide('cardValues', new Set(VALUES))
</script>

<template>
  <router-view />
</template>
