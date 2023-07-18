import { ActionType } from './symbols';
import { STATE_ACTIONS } from './token';
import { Metadata } from './metadata';

export function Action(actions: ActionType | ActionType[]): MethodDecorator {
  return <T>(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
    const getters: Record<string, { method: T | undefined; actions: ActionType | ActionType[]; fn: string | symbol }> =
      Metadata.getMetadata(STATE_ACTIONS, target.constructor) || {};

    if (typeof propertyKey === 'string') {
      getters[propertyKey] = {
        method: descriptor.value,
        actions,
        fn: propertyKey,
      };
      console.log(getters);
      Metadata.defineMetadata(STATE_ACTIONS, getters, target.constructor);
    }
  };
}
