import { FULL_STATE_KEY, STATE_GETTERS, STATE_GETTERS_PATHS } from './token';
import { Metadata } from './metadata';

export function Getter(): MethodDecorator {
  return <T>(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
    const getters: Record<string, { method: T | undefined; fn: string | symbol }> =
      Metadata.getMetadata(STATE_GETTERS, target) || {};
    const gettersPaths: WeakMap<any, any> = Metadata.getMetadata(STATE_GETTERS_PATHS, target) || new WeakMap();

    if (typeof propertyKey === 'string') {
      getters[propertyKey] = {
        method: descriptor.value,
        fn: propertyKey,
      };

      gettersPaths.set(target[propertyKey] as () => void, {
        ...getters[propertyKey],
        stateClass: target,
      });

      if (!gettersPaths.has(target)) {
        gettersPaths.set(target, {
          method: target,
          fn: FULL_STATE_KEY,
          stateClass: target,
        });
      }

      Metadata.defineMetadata(STATE_GETTERS_PATHS, gettersPaths, target);
      Metadata.defineMetadata(STATE_GETTERS, getters, target);
    }
  };
}
