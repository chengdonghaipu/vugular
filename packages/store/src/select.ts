import { Type } from './symbols';
import { Metadata } from './metadata';
import { FULL_STATE_FOR_WINDOW, STATE_GETTERS_PATHS } from './token';
import { Store } from './store';

export function Select(rawSelector: Type<any> | ((state: any) => void)): PropertyDecorator {
  return <T>(target: any, propertyKey: string | symbol) => {
    let cacheSate: any;

    Object.defineProperty(target, propertyKey, {
      get(): any {
        if (cacheSate) {
          return cacheSate.select(rawSelector);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const rootInjector = window.__rootInjector__;
        const store = rootInjector && rootInjector.get(Store, null, { optional: true });
        const allStates: Set<Type<any>> = Metadata.getMetadata(FULL_STATE_FOR_WINDOW, window) || new Set();

        const states = Array.from(allStates);
        for (const fromElement of states) {
          const gettersPaths: WeakMap<any, any> =
            Metadata.getMetadata(STATE_GETTERS_PATHS, fromElement) || new WeakMap();

          if (gettersPaths.has(rawSelector)) {
            cacheSate = store.use(fromElement);

            return cacheSate.select(rawSelector);
          }
        }

        console.warn(`field ${propertyKey as string} is an invalid selector`);
      },
      enumerable: true,
      set(v: any) {
        console.warn(
          `Properties: ${propertyKey as string}: Properties decorated with @Select() do not support modification`,
        );
      },
    });
  };
}
