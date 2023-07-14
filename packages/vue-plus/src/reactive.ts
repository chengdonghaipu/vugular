import { reactive } from "vue";

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

  const proxyObject = reactive(originObject);
  console.log(proxyObject);
  // 创建代理对象
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const proxy = new Proxy(this, {
    get(target, property, receiver) {
      if (reactiveKeys.includes(property as string)) {
        return proxyObject[property as string];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property: string | symbol, newValue: any, receiver: any): boolean {
      // if (typeof property === "string") {
      //   console.log(`key: ${property as string} value: ${newValue}`);
      // }

      if (reactiveKeys.includes(property as string)) {
        proxyObject[property as string] = newValue;
      }
      Reflect.set(target, property, newValue, receiver);
      return true;
    }
  });

  return proxy;
}
/*
export function ReactiveProxy() {
  return function constructorDecorator<T extends { new (...args: any[]): any }>(constructor: T) {
    const originalConstructor = constructor;

    function newConstructor(...args: any[]) {
      // 在构造函数被调用之前执行一些操作
      console.log('Before constructor');

      // 使用 Reflect.construct() 来创建类的实例
      const instance = Reflect.construct(originalConstructor, args);

      // 编译后我可以拿到class中属性列表 originObject是this中属性所组成的对象
      const originObject: Record<string, any> = {};
      const propertyDescriptor = Object.getOwnPropertyDescriptor(constructor, '__decorator__');
      const property = propertyDescriptor?.value;

      const reactiveKeys: string[] = property?.reactive || [];

      reactiveKeys.forEach((key) => (originObject[key] = instance[key]));
      console.log(originObject);
      const proxyObject = reactive(originObject);

      // 创建代理对象
      const proxy = new Proxy(instance, {
        get(target, property, receiver) {
          if (reactiveKeys.includes(property as string)) {
            return proxyObject[property];
          }
          return Reflect.get(target, property, receiver);
        },
        set(target, p: string | symbol, newValue: any, receiver: any): boolean {
          if (reactiveKeys.includes(property as string)) {
            originObject[p as string] = newValue;
          }
          Reflect.set(target, p, newValue, receiver);
          return true;
        }
      });
      // 在构造函数被调用之后执行一些操作
      console.log('After constructor');

      return proxy;
    }
    // 复制原始类的原型属性
    newConstructor.prototype = Object.create(originalConstructor.prototype);

    return newConstructor as any;
    // Object.defineProperty(proxyClass, 'name', { value: constructor.name });
    // return constructor;
  };
}
*/
