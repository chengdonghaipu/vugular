<script setup lang="ts">
import { ref } from "vue";

const list = [1]
const fff = ref(null)
</script>

<template>
  <div class="greetings1" v-for="(index) in list" :key="index">
    {{index}}
    <div  class="about">
      <div>888</div>
      <div>{{index + 1}}</div>
    </div>
  </div>
  <div ref="fff" class="about">{{444}}{{fff?.className}}</div>
  <div>222</div>
<!--  <div v-let="xxx as val">
    {{val}}
  </div>-->
  <div class="hello"></div>
</template>

<style scoped lang="less">
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
