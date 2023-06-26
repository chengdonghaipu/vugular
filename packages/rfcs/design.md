# 设计说明

## 基础说明
```ts
export default class Component {
  // 私有
  private v1 = ref<Type>()
  // 对外层暴露
  public v2 = ref<Type>()
  
  // 函数同理
  private getA () {
    return 'a'
  }
  
  public getB() {
    return 'b'
  }
}
```
编译为
```ts
export default defineComponent({
  setup() {
    const v1 = ref<Type>()
    const v2 = ref<Type>()
    
    function getA() {
      return 'a'
    }
    function getB() {
      return 'b'
    }
    
    // 注意这里, public修饰的将被导出
    defineExpose({
      v2,
      getB
    })
    
    return {
      v1,
      v2,
      getA,
      getB,
    }
  }
})
```


## 定义hooks -- 待定

```ts
@Composable
export class useFetch {
  constructor(options: UseFetchOptions) {
    this.options = options
  }
  
  private options: UseFetchOptions = {}

  public loading: Ref<boolean> = ref(false)
  public data: Ref<Record<string, any> > = ref({})

  public async fetch() {
  }
}
```
编译为
```ts
export function useFetch(opts: UseFetchOptions) {
  const options = opts;
  const loadng = ref<boolean>(false)
  const data = ref<Record<string,any>({})
  async function fetch() {
    
  }
  return {
    loading,
    data,
    fetch
  }
}
```


## 定义类 -- 待定
```ts
@DefineComponent({
  name: 'Comp',
  inheirtAttrs: true,
  extends: Comp1,
  mixins: [m1, m2],
  components: {
    'comp-a': CompA,
    'comp-b': CompB
  },
})
export default class Comp extends VuePlus<
  Mixin<M1, M2>,
  Extends<Comp1, Comp2>,
  Composables<Hooks1, Hooks2>
>(
  m1,
  m2,
  comp1,
  comp2,
  hooks1,
  hooks2,
) {
}
```
编译为
```ts
export default defineComponent({
  name: 'Comp',
  inheirtAttrs: true,
  extends: Comp1,
  mixins: [m1, m2],
  components: {
    'comp-a': CompA,
    'comp-b': CompB
  },
  setup () {
    
  }
})
```

## Props
```ts
@DefineComponent
export default class Comp extends VuePlus {
  @Prop({
    default: '',
    validator:
      (value: number) => {
        return number > 0
      }
  })
  num: number = 0; // 如果是非必要的，可以为 num?:number = 0
}

```

## Emit
```ts
export default class Comp extends VuePlus {
  private value: Ref<number> = ref(0)
  private str: Ref<string> = ref('')
  
  @Emit()
  public change() {
    return value
  }
  
  // 或者自定义Emit出去的名称
  @Emit('input')
  public handleInpu() {
    return value
  }
}
```

## Provide & Inject
```ts
// 定义
export default Comp extends VuePlus {
  @Provide(key?: string | symbol)
  public obj: Ref<{[k: string]: any}> = ref({})
}
// 使用
export default CompUse extends VuePlus {
  @Inject(key?: string | symbol)
  public obj: Ref<{[key: string]: any}> = ref({})
}
```
编译为

```ts
// define
import { inject } from "@vue/runtime-core";

export default defineComponent({
  setup() {
    const obj = ref<{ [key: string]: any }>({})
    provide('key', obj)
  }
})
// use
export default defineComponent({
  setup() {
    const obj = inject('key')
  }
})
```

## VModel
```ts
export default class Comp extends VuePlus {
  @VModel('key1')
  private key1 = ref()
  @VModel('key2')
  private key2 = ref()
  @VModel('key3')
  private key3 = ref()
}
```
to 
```ts
export default defineComponent({
  props: {
    key1: {},
    key2: {},
    key3: {}
  },
  setup(props) {
    const key1 = computed({
      get: () => props.key1,
      set: (val) => this.$emit('update:key1', val)
    })
    const key2 = computed({
      get: () => props.key1,
      set: (val) => this.$emit('update:key1', val)
    })
    const key3 = computed({
      get: () => props.key1,
      set: (val) => this.$emit('update:key1', val)
    })
  }
})
```
