<script setup>
import {onMounted} from 'vue';
import NameBox from './NameBox.vue'

const props = defineProps(['playerpos']);
let nameplate_pos = "namebox" + props.playerpos[0].toUpperCase() + props.playerpos.slice(1)

onMounted(() => {
    if (props.playerpos === "topCards") {
        let el = document.getElementById(props.playerpos);
        el.innerHTML = '';
        // el.classList.remove(card-halfrow);
        el.classList = '';
        el.classList.add("card-row");
        let newimg;
        for (let i = 0; i < 10; i++) {
            newimg = document.createElement("img");
            newimg.classList.add("card", "card-back");
            newimg.src = "/src/assets/cards/cat_cardback.jpeg";
            el.appendChild(newimg);
        }

    }
})
</script>

<template>
    <div class="card-halfrow" :id="playerpos">
        <div class="section">
            <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
        </div>
        <div class="section">
            <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
        </div>
    </div>

    <NameBox class="namebox" :namepos="nameplate_pos" />
</template>

<style scoped>
.card-row {
    position: absolute;
    display: flex;
    gap: 10px;
}
.card-halfrow {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.section {
    display: flex;
    gap: 10px;
}
.section-member {}

#leftCards {
    left: 10px;
    top: 50%;
    transform: translate(-50%, -50%);
}
#rightCards {
    right: 35%;
    top: 50%;
}
#topCards {
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
}
</style>