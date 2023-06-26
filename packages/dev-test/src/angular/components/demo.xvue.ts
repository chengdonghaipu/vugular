import { Component, Inject, InjectionToken, Optional, SkipSelf } from "vue-plus";
import { ref } from "vue";
import type { LifecycleHook } from "vue-plus";
import CommunityIcon from "./IconCommunity.vue";
import ModelDemo from "./model.xvue";
import { Injectable } from "vue-plus";
import { Input } from "vue-plus/input";
import { EventEmitter, Output } from "vue-plus/output";


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

type Footer = {
    [key: string]: any;
};

const demoToken = InjectionToken<ClassK>();

@Component({
  styleUrls: ["./demo.less"],
  components: [
    CommunityIcon,
    ModelDemo
  ],
  template: `
    <div>{{ x }}</div>
    <div ref="divRef">{{ y }}</div>
    <div>defaultValue: {{ defaultValue }}</div>
    <div>message: {{message}}</div>
    <CommunityIcon></CommunityIcon>
    <ModelDemo v-model:param="param" v-model="model" @update:modelValue="modelChange"></ModelDemo>
  `,
  providers: [
    { provide: demoToken, useClass: ClassK }
  ]
})
export default class AngularDemo implements LifecycleHook {
  x = ref(0);
  y = ref(0);
  param = "param";
  model = "model";
  divRef = ref<HTMLDivElement | null>(null);
  @Input() readonly message!: string;
  @Input() readonly defaultValue = 'default';
  @Input(true) readonly required = 'required';
  @Input(true) readonly objectInput!: Readonly<Footer>
  @Output() messageChange = new EventEmitter<string>();

  modelChange = (v) => {
    console.log(v);
  }

  private update = (event: MouseEvent) => {
    this.x.value = event.x;
    this.y.value = event.y;
    this.messageChange.emit(String(this.y.value))
  };

  constructor(@Optional() @Inject(demoToken) public demoData: ClassK, @Optional() private root: RootClassK2) {
    console.log(demoData, root);
  }

  private pMethod() {
  }

  onMounted(): void {
    class Test {
      b!: string
    }
    const test = new Test();
    // @ts-ignore
    test.a = ''
    Object.defineProperty(Object.getPrototypeOf(test), 'a', {
      get() {
        console.log('原型A');
      },
      set(v) {},
      enumerable: true
    })

    console.log(test);
    // @ts-ignore
    console.log(test.a);
    // console.log(this.demoData);
    window.addEventListener("mousemove", this.update);
    console.log(this);
  }

  onUnmounted(): void {
    window.removeEventListener("mousemove", this.update);
  }
}
