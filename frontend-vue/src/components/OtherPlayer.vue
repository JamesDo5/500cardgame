<script setup>
import {onMounted} from 'vue';
import NameBox from './NameBox.vue'

const props = defineProps(['playerpos']);
let nameplate_pos = "namebox" + props.playerpos[0].toUpperCase() + props.playerpos.slice(1)

onMounted(() => {
    if (props.playerpos === "topCards") {
        let el = document.getElementById(props.playerpos);
        el.innerHTML = '';
        el.classList = '';
        el.classList.add("card-row");
        el.classList.remove("card-halfrow");
        let newimg;
        for (let i = 0; i < 10; i++) {
            newimg = document.createElement("img");
            newimg.classList.add("fake-card", "card-back");
            newimg.src = "/src/assets/cards/cat_cardback.jpeg";
            el.appendChild(newimg);
        }

    }
})
</script>

<template>
    <div class="card-halfrow" :id="playerpos">
        <div class="section">
            <img class="fake-card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="fake-card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="fake-card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="fake-card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="fake-card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
        </div>
        <div class="section">
            <img class="fake-card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="fake-card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="fake-card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="fake-card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
            <img class="fake-card card-back section-member" src="../assets/cards/cat_cardback.jpeg">
        </div>
    </div>

    <NameBox :namepos="nameplate_pos" :playername="props.playerpos" />
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
    left: 5px;
    top: 44%;
    transform: translate(0%, -50%);
}
#rightCards {
    right: 5px;
    top: 44%;
    transform: translate(0%, -50%);
}
#topCards {
    top: 5px;
    left: 50%;
    transform: translate(-50%, 0%);
}
</style>