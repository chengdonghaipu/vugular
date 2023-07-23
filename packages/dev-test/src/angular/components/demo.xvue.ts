import { Component } from '@vugular/core'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { onMounted, onUnmounted, ref } from 'vue'
import type { LifecycleHook } from '@vugular/core'
import CommunityIcon from './IconCommunity.vue'
import ModelDemo from './model.xvue'
import { Input } from '@vugular/core'
import { EventEmitter, Output } from '@vugular/core'
import AngularChild from './model.xvue.ts.vue'
import { ViewChild, ViewChildren } from '@vugular/core'
import { Watch } from '@vugular/core'
import { HookReturns, hooksCompose } from '@vugular/core'
import type { NavigationGuard } from 'vue-router'
import { UpdateUserAge, UserState } from '@/angular/store/user.state'
import type { UserModel } from '@/angular/store/user.state'
import { LinkState, Select, Store, StoreState } from '@vugular/store'

function useMouse() {
  // 被组合式函数封装和管理的状态
  const x = ref(0)
  const y = ref(0)

  // 组合式函数可以随时更改其状态。
  function update(event: { pageX: number; pageY: number }) {
    x.value = event.pageX
    y.value = event.pageY
  }

  // 一个组合式函数也可以挂靠在所属组件的生命周期上
  // 来启动和卸载副作用
  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  // 通过返回值暴露所管理的状态
  return { x, y }
}

type Footer = {
  [key: string]: any
}

@Component({
  styleUrls: ['./demo.less'],
  components: [
    CommunityIcon,
    ModelDemo
    // AngularTest
  ],
  template: `
    <ul>
      <li v-for="item in ['fd', 'fd', 'gf']" v-bind:key="item" ref="itemRefs">
        {{ item }}
      </li>
    </ul>
    <div>{{ x }}</div>
    <div ref="divRef">{{ y }}</div>
    <div>defaultValue: {{ defaultValue }}</div>
    <div>message: {{ message }}</div>
    <CommunityIcon></CommunityIcon>
    <ModelDemo v-model:param="param" v-model="model" ref="childRef"></ModelDemo>
    <div>{{ model }}</div>
    <div>{{ param }}</div>
    <div>{{ testProxy }}</div>
    <div>{{ testGetter }}</div>
    <div>username: {{ username }}</div>
    <div>sex: {{ sex }}</div>
    <div>age: {{ age }}</div>
    <!--    <AngularTest></AngularTest>-->
  `
})
export default class AngularDemo
  extends HookReturns<ReturnType<typeof useMouse>>
  implements LifecycleHook
{
  @Select(UserState.getName) username?: string
  @Select(UserState.sexFormat) sex?: string
  @Select(UserState) user?: UserModel

  get age() {
    return this.user?.age
  }
  // x = ref(0);
  // y = ref(0);
  param = ref('param')
  model = ref('model')
  testProxy = 'testProxy'
  @ViewChildren() itemRefs?: HTMLDivElement[]
  @ViewChild() childRef?: AngularChild
  @Input() readonly message!: string
  @Input() readonly defaultValue = 'default'
  @Input(true) readonly required = 'required'
  @Input(true) readonly objectInput!: Readonly<Footer>
  @Output() messageChange = new EventEmitter<string>()

  @LinkState(UserState) userState!: StoreState<UserModel, UserState>
  @Watch<AngularDemo>((context) => context.y.value)
  xChange(newX: number) {
    console.log(`x is ${newX}`)
  }

  get testGetter() {
    return this.param.value
  }

  set testGetter(value) {
    this.param.value = value
  }

  constructor(public store: Store) {
    super()
    console.log(this.userState)

    this.userState.subscribe((mutation, state) => {
      console.log(mutation.type)
      console.log(mutation.events)
      console.log(mutation.storeId)
      console.log(state)
    })

    this.userState.onAction(({ name, after, onError, args, store }) => {
      console.log({
        name,
        args
      })
    })

    setTimeout(() => {
      this.userState.dispatch(new UpdateUserAge(18)).then()
    }, 4000)
  }
  modelChange = (v: any) => {
    console.log('modelChange', v)
  }

  onSetup() {
    const { x, y } = useMouse()
    // hooksCompose(this, useMouse())

    return { x, y }
  }

  onMounted(): void {
    console.log(this.itemRefs)
    console.log('this.childRef.value!.model')
    console.log(this.childRef?.model)

    // setInterval(() => {
    //   this.testProxy += '1'
    // }, 1000)
  }

  onUnmounted(): void {}

  onBeforeRouteLeave(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): ReturnType<NavigationGuard> {
    console.log(to, 'onBeforeRouteLeave')
    next()
  }

  onBeforeRouteUpdate(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): ReturnType<NavigationGuard> {
    console.log(to, 'onBeforeRouteUpdate')
  }
}
