<script setup>
import JamesStuff from './components/JamesStuff.vue'
import DevButtons from './components/DevButtons.vue'
import { ref } from 'vue'


// Bus the game table ready event to siblings
const devButtonsRef = ref(null);
function gameTableReadyBus() {
  devButtonsRef.value.startDevButtons();
}

</script>

<template>
  <JamesStuff @gametable-ready="gameTableReadyBus"/>
  <DevButtons ref="devButtonsRef"/>
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
