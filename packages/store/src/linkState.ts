import { Type } from './symbols';
import { Store } from './store';

export function LinkState<T>(state: Type<T>): PropertyDecorator {
  return <T>(target: any, propertyKey: string | symbol) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const rootInjector = window.__rootInjector__;
    const store = rootInjector && rootInjector.get(Store, null, { optional: true });
    const newKey = `$$NS__${propertyKey as string}__`;

    Object.defineProperty(target, propertyKey, { value: store.use(state), writable: false });
  };
}
