import { NATIVE } from "./const";
import { ComponentPublicInstance, ref } from "vue";

const contextKeyMap: WeakMap<object, any> = new WeakMap();

export function Output(): PropertyDecorator;
export function Output(alias: string): PropertyDecorator;
export function Output(alias?: any): PropertyDecorator {
  return function(target, propertyKey) {
    const newKey = `$$NS__${propertyKey as string}__`;

    Object.defineProperty(target, propertyKey, {
      get() {
        const context = contextKeyMap.get(this);

        let value = context ? context[newKey] : undefined;

        if (!value) {
          value = new EventEmitter();
          const context = contextKeyMap.get(this) || contextKeyMap.set(this, {}).get(this);

          const native = this[NATIVE] as ComponentPublicInstance;

          value.cxt = value.cxt || {};

          Object.assign(value.cxt, {
            event: alias || propertyKey,
            $emit: native.$emit.bind(native),
          });

          context[newKey] = value;
        }

        return value;
      },
      set(val) {
        const context = contextKeyMap.get(this) || contextKeyMap.set(this, {}).get(this);
        const native = this[NATIVE] as ComponentPublicInstance;

        if (context[newKey] === undefined && native) {


          val.cxt = val.cxt || {}

          Object.assign(val.cxt, {
            event: alias || propertyKey,
            $emit: native.$emit.bind(native)
          });
          context[newKey] = val;
        } else {
          // throw new Error(`${propertyKey as string} 为只读属性 不允许修改!`);
        }
      },
      enumerable: true,
      configurable: true
    });
  };
}

class _ModelParams {
  constructor(public params: string) {
  }
}

export function ModelParams(params: string) {
  return new _ModelParams(params);
}

class _ModelModifiers {
  constructor() {
  }
}

export function ModelModifiers() {
  return new _ModelModifiers();
}

interface EmitterCxt {
  event: string;
  $emit: (event: string, eventParams: any) => void;
}

export class EventEmitter<T = any> {
  protected cxt!: EmitterCxt;
  emit(value: T) {
    this.cxt.$emit(this.cxt.event, value);
  }

}

export class ModelMetaEmitter<T = any> extends EventEmitter<T> {
  public get value(): T | null {
    return this.v;
  }
  public readonly modelModifiers: Record<string, boolean> = {};

  constructor(private v: T | null) {
    super();
  }
}


export function Model(): PropertyDecorator;
export function Model(params: string): PropertyDecorator;
// export function Model(modifiers: _ModelModifiers): PropertyDecorator;
// export function Model(params: _ModelParams, modifiers: _ModelModifiers): PropertyDecorator;
export function Model(p1?: any): PropertyDecorator {
  return function (target, propertyKey) {
    // const newKey = `$$NS__${propertyKey as string}__`;
    let event = '';
    const props: string[] = [];

    if (!p1) {
      event = 'update:modelValue';
      props.push('modelValue');
    } else if (p1 && typeof p1 === "string") {
      event = `update:${p1}`;
      props.push(p1);
    }

    Object.defineProperty(target, propertyKey, {
      get() {
        const native = this[NATIVE] as ComponentPublicInstance;
        const key = props[0];
        // const context = contextKeyMap.get(this);
        // console.log(native, key, (native.$props as Record<string, any>)[key]);
        // const value = context ? context[newKey] : undefined;
        // console.log('get11', (native.$props as Record<string, any>)[key] || value);
        return (native.$props as Record<string, any>)[key];
      },
      set(val) {
        // console.log('val', val);
        // console.log(val);

        const native = this[NATIVE] as ComponentPublicInstance;

        native.$emit.bind(native)(event, val);
      },
      enumerable: true,
    });
  }
}

