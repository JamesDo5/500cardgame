import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import Statestore from './stateStore.js';
import { router } from './router.js';
import { installCardImageFallback } from './game/cards.js';
import { cardDrag } from './drag.js';

installCardImageFallback();

const app = createApp(App);
app.use(Statestore);
app.use(router);

if (import.meta.env.DEV) {
    window.__store = Statestore;
    window.__cardDrag = cardDrag;
}

app.mount('#app');
