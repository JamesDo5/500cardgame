import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import Statestore from './stateStore.js';


const app = createApp(App);
app.use(Statestore);

app.mount('#app');
