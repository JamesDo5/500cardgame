<template>
    <div>
        <input v-model="message" @keyup.enter="sendMessage">
        <button @click="sendMessage">Send</button>
        <ul>
            <li v-for="msg in messages">{{ msg }}</li>
        </ul>
    </div>
</template>

<script setup>
// Foundation of this from Arthur C. Codex, Reintech, "Working with Vue.js and WebSockets"
import { ref, onMounted } from 'vue'

const message = ref('')
const messages = ref([])
const socket = ref(null)


function sendMessage() {
    if (message.trim() !== '') {
        socket.send(message);
        message.value = '';
    }
}

onMounted(() => {
    socket.value = new WebSocket('ws://localhost:3000');
    socket.onmessage = (event) => {
        messages.push(event.data);
    };
})

</script>