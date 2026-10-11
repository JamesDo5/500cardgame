<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import RulesBook from '../components/RulesBook.vue';
import { loadName, saveName, normalizeGameId } from '../session.js';
import { DEV, WIKIPEDIA_URL, SITE_URL, LOCAL_GAME_ID } from '../config.js';

const router = useRouter();
const rulesRef = ref(null);
const name = ref(loadName());
const joinId = ref('');

function newGame() {
    if (!name.value.trim()) return;
    saveName(name.value);
    router.push({ name: 'new' });
}
function joinGame() {
    const id = normalizeGameId(joinId.value);
    if (!name.value.trim() || id.length < 4) return;
    saveName(name.value);
    router.push({ name: 'game', params: { id } });
}
</script>

<template>
    <main class="home">
        <header class="home-header">
            <a class="home-back" :href="SITE_URL">← jamesdouthit.com</a>
            <h1 class="home-title">500</h1>
            <p class="home-sub">4 players required! We use "Avondale" scoring from the Wikipedia with no misère. We use a 5-card blind and 1 joker.</p>
            <div class="home-links">
                <button class="ui-button" type="button" @click="rulesRef?.show()">Read the rules</button>
                <a class="ui-button" :href="WIKIPEDIA_URL" target="_blank" rel="noopener">500 on Wikipedia</a>
            </div>
        </header>

        <section class="home-forms">
            <div class="panel">
                <h2>Your name</h2>
                <input v-model="name" class="ui-input" maxlength="24" placeholder="Name shown at the table">
                <p class="hint">Remembered on this device. Use the same name to rejoin a game you left.</p>
            </div>
            <form class="panel" @submit.prevent="newGame">
                <h2>Start a new game</h2>
                <p class="hint">Start a fresh game</p>
                <button class="ui-button primary wide" type="submit" :disabled="!name.trim()">New game</button>
            </form>
            <form class="panel" @submit.prevent="joinGame">
                <h2>Join a game</h2>
                <input v-model="joinId" class="ui-input id-input" maxlength="8" placeholder="GAME ID" autocapitalize="characters" spellcheck="false">
                <button class="ui-button primary wide" type="submit" :disabled="!name.trim() || normalizeGameId(joinId).length < 4">Join</button>
                <p class="hint">Or open the link your host shared.</p>
            </form>
        </section>

        <router-link v-if="DEV" class="dev-link" :to="{ name: 'game', params: { id: LOCAL_GAME_ID } }">Practice vs bots (dev only)</router-link>
        <RulesBook ref="rulesRef" />
    </main>
</template>

<style scoped>
.home {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px 64px;
    color: #ecf0f1;
    font-family: Arial, sans-serif;
    box-sizing: border-box;
}
.home-header { text-align: center; max-width: 720px; }
.home-back { color: #bdc3c7; text-decoration: none; font-size: 14px; letter-spacing: 1px; }
.home-back:hover { color: #f1c40f; }
.home-title {
    font-size: 120px;
    margin: 12px 0 0;
    line-height: 1;
    letter-spacing: 6px;
    font-weight: 800;
    text-shadow: 0 6px 0 #0f1a24;
}
.home-sub { font-size: 18px; color: #bdc3c7; margin: 12px 0 20px; }
.home-links { display: flex; gap: 12px; justify-content: center; }
.home-forms {
    display: grid;
    grid-template-columns: repeat(3, 300px);
    gap: 20px;
    margin-top: 48px;
}
@media (max-width: 1000px) {
    .home-forms { grid-template-columns: 300px; }
}
.panel {
    background: #2c3e50;
    border: 3px solid #ecf0f1;
    padding: 22px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
}
.panel h2 { margin: 0; font-size: 20px; letter-spacing: 1px; }
.hint { font-size: 13px; color: #bdc3c7; margin: 0; line-height: 1.5; }
.id-input { text-transform: uppercase; letter-spacing: 6px; font-weight: 700; text-align: center; }
.wide { width: 100%; }
.dev-link { margin-top: 40px; color: #7f8c8d; font-size: 13px; }
</style>
