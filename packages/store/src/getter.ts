import { STATE_GETTERS } from './token';
import { Metadata } from './metadata';

export function Getter(): MethodDecorator {
  return <T>(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
    const getters: Record<string, { method: T | undefined; fn: string | symbol }> =
      Metadata.getMetadata(STATE_GETTERS, target) || {};

    if (typeof propertyKey === 'string') {
      getters[propertyKey] = {
        method: descriptor.value,
        fn: propertyKey,
      };

      Metadata.defineMetadata(STATE_GETTERS, getters, target);
    }
  };
}
