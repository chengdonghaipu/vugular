<script setup lang="ts">
import AngularDemo from '../angular/components/demo.xvue'
import {onMounted, ref} from "vue";
defineProps<{
  msg: string
}>()
const x= ref(0)
function messageChange(f) {
  // console.log(f);
}
const child = ref(null)
onMounted(() => {
  // child.value 是 <Child /> 组件的实例
  // console.log(child);
})
</script>

<template>
  <div class="greetings">
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
