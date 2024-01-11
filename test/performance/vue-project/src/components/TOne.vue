<script setup>
import TTwo from "./TTwo.vue";
defineProps({
  arr: {
    type: Array,
    required: true,
    value: [],
  },
});
</script>

<template>
  <div>
    <TTwo v-for="item of arr" :val="item.val" :key="item.id"></TTwo>
  </div>
</template>

<style scoped></style>
