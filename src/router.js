import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './pages/HomePage.vue';
import GameRoom from './pages/GameRoom.vue';

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: HomePage },
        { path: '/new', name: 'new', component: GameRoom, props: { gameId: 'new' } },
        { path: '/g/:id', name: 'game', component: GameRoom, props: route => ({ gameId: String(route.params.id).toUpperCase() }) },
        { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
});
