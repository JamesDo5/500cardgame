<script setup>
import { onMounted } from 'vue';

const props = defineProps(['namepos', 'playername']);

onMounted(() => {
    // if (props.namepos !== "nameboxTopCards") {
    //     let el = document.getElementById(props.namepos);
    //     el.
    // }
});
</script>

<template>
    <div class="namecard" :id="namepos">
        <div class="namecard-bg"></div>
        {{ playername }}
    </div>
    <!-- <div class="namecard" :id="namepos">{{ playername }}</div> -->
</template>

<style scoped>
.namecard {
  position: relative;
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(149, 8, 8, 0.1);
  display: inline-block;
  letter-spacing: 1px;
  font-weight: 600;
  transition: all 0.3s ease;
  font-family: Arial, sans-serif;
}
#nameboxLeftCards {
    top: -320px;
    left: 5%;
}
#nameboxTopCards {
    top: -565px;
    left: 30.5%;
}
#nameboxRightCards {
    top: -320px;
    right: -57%;
}

.namecard-bg {
  position: absolute;
  background: linear-gradient(45deg, #3498db, #2ecc71);
  content: '';
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 10px;
  opacity: 0.6;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.namecard:hover {
  transform: scale(1.05);
}

.namecard:hover .namecard-bg {
  opacity: 0.8;
}
</style>