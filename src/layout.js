import { reactive } from 'vue';

export const layout = reactive({ portrait: false });

const coarse = window.matchMedia('(pointer: coarse)');
const upright = window.matchMedia('(orientation: portrait)');
const mobileAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const forced = new URLSearchParams(window.location.search).get('layout');

function update() {
    if (forced) {
        layout.portrait = forced === 'portrait';
        return;
    }
    const touch = coarse.matches || mobileAgent;
    layout.portrait = touch && (upright.matches || window.innerWidth < 700);
}

update();
coarse.addEventListener('change', update);
upright.addEventListener('change', update);
window.addEventListener('resize', update);
window.addEventListener('orientationchange', update);
