<script setup>
import { ref } from "vue";

import TOne from "./components/TOne.vue";

const arr = [];
for (let i = 1; i <= 2000; i++) {
  arr.push({
    id: i,
    val: i * 10,
  });
}

const vArr = ref([]);

// let vArr = [];

Promise.resolve()
  .then(() => {
    return new Promise((res) => {
      setTimeout(() => {
        let initStartTime = performance.now();
        // $("t-one").arr = arr;
        vArr.value = arr;
        console.log("init data time: ", performance.now() - initStartTime);
        setTimeout(() => {
          document.querySelector("#init-time").innerHTML =
            performance.now() - initStartTime;
          res();
        });
      }, 100);
    });
  })
  .then(() => {
    return new Promise((res) => {
      setTimeout(() => {
        const arr2 = arr.slice();
        arr2[2].val = "change val";

        const resetStartTime = performance.now();
        // $("t-one").arr = arr2;
        vArr.value = arr2;
        console.log("reset data time: ", performance.now() - resetStartTime);
        setTimeout(() => {
          document.querySelector("#reset-item-time").innerHTML =
            performance.now() - resetStartTime;
          res();
        });
      }, 100);
    });
  })
  .then(() => {
    return new Promise((res) => {
      setTimeout(() => {
        const arr2 = arr.slice();
        arr2.splice(2, 0, { id: 2000000, val: "200000+" });

        const resetStartTime = performance.now();
        // $("t-one").arr = arr2;
        vArr.value = arr2;
        console.log("reset data time: ", performance.now() - resetStartTime);
        setTimeout(() => {
          document.querySelector("#splice1-time").innerHTML =
            performance.now() - resetStartTime;
          res();
        });
      }, 1000);
    });
  })
  .then(() => {
    return new Promise((res) => {
      setTimeout(() => {
        const arr2 = arr.slice();
        arr2.splice(2, 1);

        const resetStartTime = performance.now();
        // $("t-one").arr = arr2;
        vArr.value = arr2;
        console.log("reset data time: ", performance.now() - resetStartTime);
        setTimeout(() => {
          document.querySelector("#splice2-time").innerHTML =
            performance.now() - resetStartTime;
          res();
        });
      }, 1000);
    });
  })
  .then(() => {
    return new Promise((res) => {
      setTimeout(() => {
        const arr2 = arr.slice();
        arr2.reverse();

        const resetStartTime = performance.now();
        // $("t-one").arr = arr2;
        vArr.value = arr2;
        console.log("reset data time: ", performance.now() - resetStartTime);
        setTimeout(() => {
          document.querySelector("#reset-time").innerHTML =
            performance.now() - resetStartTime;
          res();
        });
      }, 1000);
    });
  });
</script>

<template>
  <div>init array time: <span id="init-time"></span>ms</div>
  <div>set array item time: <span id="reset-item-time"></span>ms</div>
  <div>
    splice array item time (insert item time):
    <span id="splice1-time"></span>ms
  </div>
  <div>
    splice array item time (remove item time):
    <span id="splice2-time"></span>ms
  </div>
  <div>reset array time: <span id="reset-time"></span>ms</div>
  <TOne :arr="vArr" />
</template>

<style scoped></style>
