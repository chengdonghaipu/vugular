// type InputType = StringConstructor | BooleanConstructor | NumberConstructor | ObjectConstructor | DateConstructor;
// export function Input(type: InputType | boolean): ParameterDecorator;
// export function Input(type: InputType, required: boolean): ParameterDecorator;
import { NATIVE } from "./const";
import { ComponentPublicInstance } from "vue";

const contextKeyMap: WeakMap<object, any> = new WeakMap();

export function Input(): PropertyDecorator;
export function Input(alias: string): PropertyDecorator;
export function Input(required: boolean): PropertyDecorator;
export function Input(p?: any): PropertyDecorator {
  return function(target, propertyKey) {
    const newKey = `$$NS__${propertyKey as string}__`;
    // const native = this[NATIVE] as ComponentPublicInstance;
    Object.defineProperty(target, propertyKey, {
      get() {
        const native = this[NATIVE] as ComponentPublicInstance;
        let key = propertyKey as string;
        const context = contextKeyMap.get(this);

        const value = context ? context[newKey] : undefined;

        if (typeof p === "string") {
          key = p;
        }

        return (native.$props as Record<string, any>)[key] || value;
      },
      set(val) {
        const context = contextKeyMap.get(this) || contextKeyMap.set(this, {}).get(this);

        if (context[newKey] === undefined) {
          context[newKey] = val;
        } else {
          throw new Error(`${propertyKey as string} 为只读属性 不允许修改!`);
        }
      },
      enumerable: true
    });
  };
}
