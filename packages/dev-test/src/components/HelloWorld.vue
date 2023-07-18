<script setup lang="ts">
import AngularDemo from '../angular/components/demo.xvue'
import { onMounted, ref, watch } from "vue";
import CustomInput from './CustomInput.vue'
import Test1 from './Test1.vue'
import Test2 from './Test2.vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from "vue-router";
import { defineStore } from 'pinia'

const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
})
// useCounterStore().$state
defineProps<{
  msg: string
}>()
const x= ref(0)
function messageChange(f) {
  // console.log(f);
}
const message = ref('hello')
const route = useRoute();
console.log(route.params, 'fdfdf');

onMounted(() => {
  // child.value 是 <Child /> 组件的实例
  // console.log(child);
  console.log(222);

})
</script>

<template>
  <div class="greetings">
<!--    <CustomInput v-model="message" /> {{ message }}-->
    <!--    <Test1 v-model="message" /> {{ message }}-->
<!--    <Test2/>-->
    <AngularDemo ref="child" :message="'hello'" @message-change="messageChange"></AngularDemo>
<!--    <h1 class="green">{{ msg }}</h1>-->
<!--    <h3>-->
<!--      You’ve successfully created a project with-->
<!--      <a href="https://vitejs.dev/" target="_blank" rel="noopener">Vite</a> +-->
<!--      <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue 3</a>. What's next?-->
<!--    </h3>-->
  </div>
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
