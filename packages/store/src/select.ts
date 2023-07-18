import { ActionType, Type } from './symbols';

export function Select<T>(rawSelector: Type<T> | ((state: any) => void)): PropertyDecorator {
  return <T>(target: any, propertyKey: string | symbol) => {};
}
