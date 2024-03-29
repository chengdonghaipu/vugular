import { ActionDef, StateContext, Type } from './symbols';
import { defineStore, Store, StoreDefinition } from 'pinia';
import { Metadata } from './metadata';
import { FULL_STATE_FOR_WINDOW, META_KEY, STATE_STORE } from './token';
import { ActionHandlerMetaData, MetaDataModel } from './state';
import { windows } from 'rimraf';

class StateContextImp<T = any> implements StateContext<T> {
  #store: Store<string, any>;

  #metadata: MetaDataModel;

  // eslint-disable-next-line @typescript-eslint/ban-types
  set store(value: StoreDefinition<string, any, {}, {}>) {
    this.#store = value();
    Metadata.defineMetadata(STATE_STORE, this.#store, this.stateClass);
  }

  constructor(private readonly stateClass: Type<T>) {
    this.#metadata = Metadata.getMetadata(META_KEY, stateClass) || ({} as MetaDataModel);
  }

  async dispatch(actions: ActionDef | ActionDef[]): Promise<void> {
    const results = Object.values(this.#metadata.actions).filter((value: ActionHandlerMetaData) => {
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
          filters.map(() => {
            const result = this.#store[value.fn]();
            if (result instanceof Promise) {
              return result;
            }

            return Promise.resolve(result);
          }),
        );
      }),
    );
  }

  getState(): T {
    return this.#store.$state as T;
  }

  patchState(val: Partial<T>): T {
    this.#store.$patch(val);

    return this.getState();
  }

  setState(val: T): T {
    this.#store.$state = val;
    return this.getState();
  }
}

export function useState(state: Type<any>, instance: any) {
  const allStates: Set<Type<any>> = Metadata.getMetadata(FULL_STATE_FOR_WINDOW, window) || new Set();
  if (!allStates.has(state)) {
    allStates.add(state);
  }
  Metadata.defineMetadata(FULL_STATE_FOR_WINDOW, allStates, window);
  // const options: StoreOptions<any> = Metadata.getMetadata(META_OPTIONS_KEY, state) || ({} as StoreOptions<any>);
  const metadata: MetaDataModel = Metadata.getMetadata(META_KEY, state) || ({} as MetaDataModel);

  const stateContextImp = new StateContextImp(state);

  const store = defineStore(metadata.name, {
    state: () => metadata.defaults || {},
    getters: Object.entries(metadata.getters).reduce(
      (previousValue, currentValue) =>
        Object.assign(previousValue, {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          [currentValue[0]]: state[currentValue[1].fn],
        }),
      {},
    ),
    actions: Object.entries(metadata.actions).reduce(
      (previousValue, currentValue) =>
        Object.assign(previousValue, {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          [currentValue[0]]: (payload) => {
            instance[currentValue[1].fn](stateContextImp, payload);
          },
        }),
      {},
    ),
  });
  // store();
  stateContextImp.store = store;
}
