import { ActionType } from './symbols';

export function Action(actions: ActionType | ActionType[]): MethodDecorator {
  return <T>(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {};
}
