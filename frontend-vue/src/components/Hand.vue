<template>
    <div class="card-row" id="bottomCards">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
        <img class="card card-back hand-card" src="../assets/cards/cat_cardback.jpeg">
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
const emit = defineEmits(['hand-ready'])

onMounted(() => {
    emit('hand-ready');
});
</script>

<style scoped>
.card-row {
  position: absolute;
  display: flex;
  gap: 10px;
}
#bottomCards {
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  /* BELOW ARE FROM CHATGPT */
  /* transition: transform 0.3s ease; */
  /* transform-style: preserve-3d; */
}
.flipped {
    transform: rotateY(180deg);
    perspective: 1000px;
}
.bouncy {
  animation: MoveUpDown 2s linear infinite;
}
@keyframes MoveUpDown {
  0%, 100% {
    /* transform: translate(-50%, 0); */
    transform: translateY(0);
  }
  75% {
    /* transform: translate(-50%, -4px); */
    transform: translateY(-4px);
  }
}

</style>