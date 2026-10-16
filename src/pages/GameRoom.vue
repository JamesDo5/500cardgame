<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex'
import { useRouter } from 'vue-router';
import GamePage from '../components/GamePage.vue'
import DevButtons from '../components/DevButtons.vue'
import LobbyOverlay from '../components/LobbyOverlay.vue'
import RulesBook from '../components/RulesBook.vue'
import { DEV, mode, WS_URL, STAGE_WIDTH, STAGE_HEIGHT, PORTRAIT_STAGE_WIDTH, PORTRAIT_STAGE_MIN_HEIGHT, LOCAL_GAME_ID, DEFAULT_PACE } from '../config.js'
import { layout } from '../layout.js'
import { socket } from '../net/socket.js'
import { C2S } from '../net/messages.js'
import { installHandlers } from '../net/handlers.js'
import { loadName, saveName, loadToken, forgetToken } from '../session.js'

const props = defineProps(['gameId']);
const store = useStore();
const router = useRouter();

mode.standalone = DEV && props.gameId.toLowerCase() === LOCAL_GAME_ID;

const devButtonsRef = ref(null);
const rulesRef = ref(null);
const stageStyle = ref({});
const nameInput = ref(loadName());
const needName = ref(!mode.standalone && !nameInput.value);
const confirmLeave = ref(false);
const confirmRestart = ref(false);

const gameState = computed(() => store.state.gameState);
const inLobby = computed(() => !mode.standalone && gameState.value === -1 && !store.state.joinError);
const joinError = computed(() => store.state.joinError);
const displayId = computed(() => store.state.session.gameId || (props.gameId === 'new' ? '····' : props.gameId));
const showLeave = computed(() => gameState.value >= 0 && gameState.value !== 6);
const iAmHost = computed(() => mode.standalone || !!store.state.lobby.seats?.[0]?.host);

function fitStage() {
    const w = layout.portrait ? PORTRAIT_STAGE_WIDTH : STAGE_WIDTH;
    const h = layout.portrait ? Math.max(PORTRAIT_STAGE_MIN_HEIGHT, Math.round(w * window.innerHeight / window.innerWidth)) : STAGE_HEIGHT;
    const scale = Math.min(window.innerWidth / w, window.innerHeight / h);
    stageStyle.value = {
        width: `${w}px`,
        height: `${h}px`,
        left: `${(window.innerWidth - w * scale) / 2}px`,
        top: `${(window.innerHeight - h * scale) / 2}px`,
        transform: `scale(${scale})`,
    };
}
fitStage();
watch(() => layout.portrait, fitStage);

function connect() {
    const name = nameInput.value.trim();
    const joiningExisting = props.gameId !== 'new';
    installHandlers(socket, store);
    socket.setJoin({ gameId: joiningExisting ? props.gameId : '', playerName: name, playerToken: joiningExisting ? loadToken(props.gameId) : '' });
    socket.connect(WS_URL);
}

function submitName() {
    const name = nameInput.value.trim();
    if (!name) return;
    saveName(name);
    needName.value = false;
    connect();
}

function tableReady() {
    if (mode.standalone) {
        devButtonsRef.value?.startDevButtons();
        return;
    }
    if (!needName.value) connect();
}

function leaveNow() {
    if (!mode.standalone) {
        socket.send(C2S.LEAVE);
        setTimeout(() => socket.close(), 150);
    }
    confirmLeave.value = false;
    router.push({ name: 'home' });
}

function requestLeave() {
    if (gameState.value >= 0 && gameState.value !== 6) confirmLeave.value = true;
    else leaveNow();
}

function requestRestart() {
    confirmLeave.value = false;
    confirmRestart.value = true;
}

function restartNow() {
    confirmRestart.value = false;
    if (mode.standalone) store.getters.getGameTable().newGame();
    else socket.send(C2S.RESTART_GAME);
}

function backHome() {
    socket.close();
    if (props.gameId !== 'new') forgetToken(props.gameId);
    store.commit('setJoinError', '');
    router.push({ name: 'home' });
}

watch(() => store.state.session.gameId, (id) => {
    if (id && props.gameId === 'new') router.replace({ name: 'game', params: { id } });
});

store.commit('resetGame');
store.commit('setGameState', -1);
store.commit('setJoinError', '');
store.commit('setLobby', { seats: [], hostPos: -1, canStart: false });
store.commit('setPace', DEFAULT_PACE);
store.commit('setConnection', mode.standalone ? 'standalone' : 'idle');

onMounted(() => {
    document.body.classList.add('in-game');
    window.addEventListener('resize', fitStage);
});
onBeforeUnmount(() => {
    document.body.classList.remove('in-game');
    window.removeEventListener('resize', fitStage);
    if (!mode.standalone) socket.close();
    mode.standalone = false;
});
</script>

<template>
    <div id="stage" :style="stageStyle">
        <GamePage @gametable-ready="tableReady" />
        <DevButtons v-if="mode.standalone" ref="devButtonsRef" />

        <div v-if="showLeave" class="table-chrome" :class="{ standalone: mode.standalone }">
            <button class="ui-button small danger" type="button" @click="requestLeave">Leave</button>
            <button class="ui-button small" type="button" @click="rulesRef?.show()">Rules</button>
        </div>

        <LobbyOverlay v-if="inLobby && !needName" :game-id="displayId" @leave="leaveNow" @rules="rulesRef?.show()" />

        <div v-if="needName" class="gate">
            <form class="gate-card" @submit.prevent="submitName">
                <div class="gate-kicker">Joining game {{ displayId }}</div>
                <label class="gate-label" for="gateName">What name should be shown at the table?</label>
                <input id="gateName" v-model="nameInput" class="ui-input" maxlength="24" autofocus placeholder="Your name">
                <div class="gate-actions">
                    <button class="ui-button" type="button" @click="backHome">Back</button>
                    <button class="ui-button primary" type="submit" :disabled="!nameInput.trim()">Join</button>
                </div>
            </form>
        </div>

        <div v-if="joinError" class="gate">
            <div class="gate-card">
                <div class="gate-kicker">Could not join {{ displayId }}</div>
                <p class="gate-text">{{ joinError }}</p>
                <div class="gate-actions">
                    <button class="ui-button primary" type="button" @click="backHome">Back to start</button>
                </div>
            </div>
        </div>

        <div v-if="confirmLeave" class="gate">
            <div class="gate-card">
                <div class="gate-kicker">Leave the game?</div>
                <p class="gate-text">The game is in progress. Leaving ends it for everyone and sends the table back to the lobby.</p>
                <div class="gate-actions">
                    <button class="ui-button" type="button" @click="confirmLeave = false">Stay</button>
                    <button v-if="iAmHost" class="ui-button" type="button" @click="requestRestart">Restart game</button>
                    <button class="ui-button danger" type="button" @click="leaveNow">Leave anyway</button>
                </div>
            </div>
        </div>

        <div v-if="confirmRestart" class="gate">
            <div class="gate-card">
                <div class="gate-kicker">Restart the game?</div>
                <p class="gate-text">Scores are cleared and everyone goes back to the lobby with the same seats.</p>
                <div class="gate-actions">
                    <button class="ui-button" type="button" @click="confirmRestart = false">Back</button>
                    <button class="ui-button danger" type="button" @click="restartNow">Restart</button>
                </div>
            </div>
        </div>

        <RulesBook ref="rulesRef" />
    </div>
</template>

<style scoped>
.table-chrome {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    gap: 8px;
    z-index: 30;
}
.table-chrome.standalone {
    top: 190px;
}
.gate {
    position: absolute;
    inset: 0;
    background: rgba(20, 30, 40, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 80;
    font-family: Arial, sans-serif;
    color: #ecf0f1;
}
.gate-card {
    width: 480px;
    background: #2c3e50;
    border: 3px solid #ecf0f1;
    padding: 28px 32px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}
.gate-kicker {
    font-size: 13px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #bdc3c7;
}
.gate-label { font-size: 22px; font-weight: 700; }
.gate-text { font-size: 17px; line-height: 1.5; margin: 0; }
.gate-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
</style>
