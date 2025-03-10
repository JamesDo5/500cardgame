<script setup>
import Websockets from './components/Websockets.vue'
import GamePage from './components/GamePage.vue'
import DevButtons from './components/DevButtons.vue'
import { ref, provide } from 'vue'
import { useStore } from 'vuex'


// Doing provide/inject instead of state storage for immutable stuff
provide('cardSuits', new Set(['h', 'd', 'c', 's', 'j']))
provide('cardValues', new Set(['4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']))
// TODO CHANGE THIS WITH WEBSOCKET
let ifGame = true;

const store = useStore()

// Bus the game table ready event to siblings
const devButtonsRef = ref(null);
function gameTableIsReady() {
  devButtonsRef.value.startDevButtons();
}


class GameController {
    constructor() {
        this.scores = [0, 0];
        this.initializeGameController();
    }

    async initializeGameController() {
        // try {
        // } catch (error) {
        //     console.error('Failed to initialize game controller:', error);
        // }
    }

    incomingScore(score0, score1) {
        if (this.scores[0] === score0 && this.scores[1] === score1) {
            return 0;
        }

        console.log("WARN server incoming score:",score0,score1,"does not agree with client scorekeeping:",this.scores[0],this.scores[1])
        this.scores[0] = score0;
        this.scores[1] = score1;

        // The reason I want to re-invoke is potential race condition where client is about to modify score when WS calls this func
        // so this enforces server score but client changes it right after, resulting in double-add.
        // The final result of this is that server score should be preferentially enforced if only server calls this func.
        setTimeout(function(){ this.incomingScore(score0,score1); }, 1000);

        return 1;
    }

    isGameOver() {
        return scores[0] >= 500 || scores[0] <= -500 || scores[1] >= 500 || scores[1] <= 500;
    }

    endGame() {
        return;
    }
}

const gameCtl = new GameController();

// VueX state
store.commit('setGameCtlr', gameCtl)

</script>

<template>
  <Websockets id="wsComponent"/>
  <GamePage v-if="ifGame" @gametable-ready="gameTableIsReady"/>
  <DevButtons v-if="ifGame" ref="devButtonsRef"/>

</template>

<style scoped>
#wsComponent {
  top: 100px;
}
</style>
