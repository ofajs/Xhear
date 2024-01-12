<script setup>
defineProps({
  val: {
    type: String,
    required: true,
    value: "",
  },
});
</script>

<template>
  <div class="con">{{ val }}</div>
</template>

<style scoped>
.con {
  border: red solid 0.8px;
  display: inline-block;
  padding: 6px;
  margin: 2px;
  border-radius: 5px;
  animation: aaa ease 2s;
}
@keyframes aaa {
  0% {
    opacity: 0;
    background-color: red;
  }
  100% {
    opacity: 1;
    background-color: transparent;
  }
}
</style>
