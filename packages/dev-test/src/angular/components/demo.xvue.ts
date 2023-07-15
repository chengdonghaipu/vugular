import { Component, Inject, InjectionToken, Optional, SkipSelf } from "vue-plus";
import type {Router} from 'vue-router'
import type { Route } from 'vue-plus'
import { onMounted, onUnmounted, ref } from "vue";
import type { LifecycleHook } from "vue-plus";
import type { Ref } from "vue";
import CommunityIcon from "./IconCommunity.vue";
import ModelDemo from "./model.xvue";
import { Injectable } from "vue-plus";
import { Input } from "vue-plus/input";
import { EventEmitter, Output } from "vue-plus/output";
import AngularChild from "./model.xvue.ts.vue";
import { ViewChild, ViewChildren } from "vue-plus/view";
import { Watch } from "vue-plus/watch";
import { HookReturns, hooksCompose } from "vue-plus/hooks";
import AngularTest from "./test.xvue";


@Injectable()
class RootClassK {

  public update() {

  }

  private pMethod() {
  }
}

@Injectable()
class RootClassK2 {

  public update() {
  }

  constructor(public root: RootClassK) {
    console.log(root);
  }

  private pMethod() {
  }
}

class ClassK {

  public update() {

  }

  private pMethod() {
  }
}

function useMouse() {
  // 被组合式函数封装和管理的状态
  const x = ref(0)
  const y = ref(0)

  // 组合式函数可以随时更改其状态。
  function update(event: { pageX: number; pageY: number; }) {
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
    [key: string]: any;
};

const demoToken = InjectionToken<ClassK>();

@Component({
  styleUrls: ["./demo.less"],
  components: [
    CommunityIcon,
    ModelDemo,
    AngularTest
  ],
  template: `
    <ul>
      <li v-for="item in ['fd', 'fd', 'gf']" v-bind:key="item" ref="itemRefs">
        {{ item }}
      </li>
    </ul>
    <div>{{ x }}</div>
    <div ref="divRef">{{ y }} </div>
    <div>defaultValue: {{ defaultValue }}</div>
    <div>message: {{message}}</div>
    <CommunityIcon></CommunityIcon>
    <ModelDemo v-model:param="param" v-model="model" ref="childRef"></ModelDemo>
    <div>{{model}}</div>
    <div>{{param}}</div>
    <div>{{testProxy}}</div>
    <div>{{testGetter}}</div>
    <AngularTest></AngularTest>
  `,
  providers: [
    { provide: demoToken, useClass: ClassK }
  ]
})
export default class AngularDemo extends HookReturns<ReturnType<typeof useMouse>> implements LifecycleHook {
  // x = ref(0);
  // y = ref(0);
  param = ref("param");
  model = ref("model");
  testProxy = 'testProxy'
  @ViewChildren() itemRefs?: HTMLDivElement[];
  @ViewChild() childRef?: AngularChild;
  @Input() readonly message!: string;
  @Input() readonly defaultValue = 'default';
  @Input(true) readonly required = 'required';
  @Input(true) readonly objectInput!: Readonly<Footer>
  @Output() messageChange = new EventEmitter<string>();

  @Watch<AngularDemo>(context => context.y.value)
  xChange(newX: number) {
    console.log(`x is ${newX}`)
  }

  get testGetter() {
    return this.param.value
  }

  set testGetter(value) {
    this.param.value = value
  }

  constructor(public router: Router, public route: Route) {
    super();
    console.log(router);
    console.log(route);
    setTimeout(() => console.log(route.name), 3000)
    // router.push({
    //   name: '',
    //   query: {}
    // })
    // const router = useRouter()
  }
  modelChange = (v: any) => {
    console.log('modelChange', v);
  }

  onSetup() {
    const {x, y} = useMouse()
    // hooksCompose(this, useMouse())

    return {x, y}
  }


  onMounted(): void {
    console.log(this.itemRefs);
    console.log('this.childRef.value!.model');
    console.log(this.childRef?.model);

    setInterval(() => {
      this.testProxy += '1';
    }, 1000)
  }

  onUnmounted(): void {
  }
}
