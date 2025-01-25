<script setup>
import Websockets from './components/Websockets.vue'
import Game from './components/Game.vue'

// TODO CHANGE THIS WITH WEBSOCKET
ifGame = true;

// STUFF FROM KILLED SUBCOMPONENTS
// defineProps({
//   msg: {
//     type: String,
//     required: true,
//   },
// })
{/* <h1 class="green">{{ msg }}</h1> */}
// Got stuck? Ask your question on
//     <a href="https://chat.vuejs.org" target="_blank" rel="noopener">Vue Land</a>
//     (our official Discord server), or
//     <a href="https://stackoverflow.com/questions/tagged/vue.js" target="_blank" rel="noopener"
//       >StackOverflow</a
// If you need to test your components and web pages, check out
//     <a href="https://vitest.dev/" target="_blank" rel="noopener">Vite</a>
//     and
//     <a href="https://www.cypress.io/" target="_blank" rel="noopener">Cypress</a>
//     /
//     <a href="https://playwright.dev/" target="_blank" rel="noopener">Playwright</a>.
</script>

<template>
  <Game v-if="ifGame"/>
  <Websockets />
  <!-- <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
    </div>
  </header>

  <main>
    <TheWelcome />
  </main> -->
</template>

<style scoped>
/* header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
} */
</style>
