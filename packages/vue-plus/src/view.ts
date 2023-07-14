import { isRef } from "vue";


function views(selector?: string) {
  return function (target: any, propertyKey: PropertyKey) {
    if (!selector) {
      selector = propertyKey as string;
    }

    Object.defineProperty(target, propertyKey, {
      get(): any {
        const views = Reflect.get(this, 'VIEWS');
        const refFn = views && views[`__vg_${selector!}__`];
        const value = refFn && refFn();
        // if (value instanceof RefImpl) {
        //
        // }
        if (value && isRef(value)) {
          return value.value
        }
        return value;
      },
      enumerable: true
    })
  }
}
export function ViewChildren(): PropertyDecorator;
export function ViewChildren(selector?: string): PropertyDecorator {
  return views(selector);
}

export function ViewChild(): PropertyDecorator;
export function ViewChild(selector?: string): PropertyDecorator {
  return views(selector);
}
