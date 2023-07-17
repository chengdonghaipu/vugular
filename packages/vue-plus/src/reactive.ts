import { computed, reactive, ref } from 'vue';

export function reactiveProxy() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const constructor = Object.getPrototypeOf(this).constructor;
  // 编译后我可以拿到class中属性列表 originObject是this中属性所组成的对象
  const originObject: Record<string, any> = {};
  const propertyDescriptor = Object.getOwnPropertyDescriptor(constructor, '__decorator__');
  const property = propertyDescriptor?.value;

  const reactiveKeys: string[] = property?.reactive || [];

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  reactiveKeys.forEach((key) => (originObject[key] = this[key]));

  const accessor = property?.accessor;

  const { getter, setter } = accessor;

  const accessorContainer: Record<string, any> = {};

  for (const getterElement of getter) {
    const isExistSetter = setter.find((v: { name: any }) => v.name === getterElement.name);
    const { name, body } = getterElement;
    if (!isExistSetter) {
      const fn = eval(`(() => ${body})()`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      accessorContainer[name] = computed(() => fn.apply(this));
    } else {
      const fnGetter = eval(`(() => ${body})()`);
      const fnSetter = eval(`(() => ${isExistSetter.body})()`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      accessorContainer[name] = computed({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        get: () => fnGetter.apply(this),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        set: () => fnSetter.apply(this),
      });
    }
  }

  const proxyObject = reactive(originObject);
  // console.log(proxyObject);
  const containerKey = `__vg_accessor_computed__`;
  // 创建代理对象
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const proxy = new Proxy(this, {
    get(target, property, receiver) {
      if (reactiveKeys.includes(property as string)) {
        return proxyObject[property as string];
      }

      if (typeof property === 'string' && property.startsWith(containerKey)) {
        const key = property.replace(containerKey, '');
        return accessorContainer[key] || ref(undefined);
      }

      return Reflect.get(target, property, receiver);
    },
    set(target, property: string | symbol, newValue: any, receiver: any): boolean {
      if (reactiveKeys.includes(property as string)) {
        proxyObject[property as string] = newValue;
      }

      Reflect.set(target, property, newValue, receiver);

      return true;
    },
  });

  return proxy;
}
