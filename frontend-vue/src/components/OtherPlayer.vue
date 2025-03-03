<script setup>
const props = defineProps(['playerLR']);

</script>

<template>
    <div class="card-halfrow" :id="playerLR">
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
</template>

<style scoped>
/* .card {
  width: 70px;
  height: 100px;
  background-color: white;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  will-change: transform;
}

.card-back {
  background-color: #3498db;
  color: white;
  font-weight: bold;
} */

.card-halfrow {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
#leftCards {
  left: 10px;
  top: 50%;
  transform: translate(-50%, -50%);
}
.section {
  display: flex;
  gap: 10px;
}
.section-member {
}
#rightCards {
  right: 35%;
  top: 50%;
}
</style>