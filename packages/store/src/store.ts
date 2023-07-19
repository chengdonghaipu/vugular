import { Type, StateContext } from './symbols';
import { Metadata } from './metadata';
import { META_KEY, STATE_GETTERS_PATHS, STATE_STORE } from './token';
import { ActionHandlerMetaData, MetaDataModel } from './state';
import { Store as PinaStore, SubscriptionCallback } from 'pinia';
import { WatchOptions } from 'vue';

type StoreOnActionListenerContext<T> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => infer Return
    ? Args extends [StateContext<any>, infer ActionArg]
      ? {
          name: K;
          args: [ActionArg];
          store: any;
          onError: (callback: (error: unknown) => void) => void;
          after: Return extends Promise<infer Result> ? (result: Result) => void : (result: ReturnType<T[K]>) => void;
        }
      : never
    : never;
}[keyof T];

export class StoreState<T, U = any> {
  readonly #store: PinaStore<string, any>;
  readonly #gettersPaths: WeakMap<Type<U> | ((state: T) => void), Record<string, any>>;

  constructor(private state: Type<U>) {
    const store = Metadata.getMetadata(STATE_STORE, state);
    this.#gettersPaths = Metadata.getMetadata(STATE_GETTERS_PATHS, state) || new WeakMap();

    if (!store) {
      throw Error(`${state.name} is not registered`);
    }

    this.#store = store;
  }

  async dispatch(actions: any | any[]): Promise<void> {
    const originParams = Array.isArray(actions) ? actions : [actions];
    if (Array.isArray(actions)) {
      actions = actions.map((action) => action.constructor);
    } else {
      actions = actions.constructor;
    }
    const metadata: MetaDataModel = Metadata.getMetadata(META_KEY, this.state) || ({} as MetaDataModel);
    const results = Object.values(metadata.actions).filter((value: ActionHandlerMetaData) => {
      const temp = Array.isArray(actions) ? actions : [actions];

      return temp.find((action) =>
        Array.isArray(value.actions) ? value.actions.includes(action) : value.actions === action,
      );
    });

    await Promise.all(
      results.map((value) => {
        const tempActions = Array.isArray(value.actions) ? value.actions : [value.actions];
        const filters = tempActions.filter((v) => (Array.isArray(actions) ? actions.includes(v) : actions === v));

        return Promise.all(
          filters.map((action) => {
            const temp = Array.isArray(actions) ? actions : [actions];
            const index = temp.findIndex((v) => v === action);
            const result = this.#store[value.fn](originParams[index]);

            if (result instanceof Promise) {
              return result;
            }

            return Promise.resolve(result);
          }),
        );
      }),
    );
  }

  subscribe(
    callback: SubscriptionCallback<T>,
    options?: {
      detached?: boolean;
    } & WatchOptions,
  ) {
    this.#store.$subscribe(callback, options);
  }

  reset(): void {
    this.#store.reset();
  }

  dispose(): void {
    this.#store.$dispose();
  }

  onAction(callback: (context: StoreOnActionListenerContext<U>) => void, detached?: boolean) {
    this.#store.$onAction(callback, detached);
  }

  select<T extends (state: any) => any>(rawSelector: T): ReturnType<T> | undefined;
  select<T>(rawSelector: Type<U>): T | undefined;
  select<T extends object, K extends keyof T>(rawSelector: K): T[K] | undefined;
  select(rawSelector: Type<U> | ((state: T) => void)): any {
    if (typeof rawSelector === 'string') {
      return this.#store[rawSelector];
    }

    if (this.#gettersPaths.has(rawSelector)) {
      const { fn, method, stateClass } = this.#gettersPaths.get(rawSelector)!;

      if (stateClass === method) {
        return this.#store.$state;
      }

      return this.#store[fn];
    }
  }
}

export class Store {
  #stateContainer: WeakMap<Type<any>, StoreState<any>> = new WeakMap<Type<any>, StoreState<any>>();

  use<State, model = any>(state: Type<State>): StoreState<model, State> {
    if (!this.#stateContainer.has(state)) {
      this.#stateContainer.set(state, new StoreState<model, State>(state));
    }

    return this.#stateContainer.get(state)!;
  }
}
