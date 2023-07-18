import { ActionDef, StateContext, Type } from './symbols';
import { defineStore, Store, StoreDefinition } from 'pinia';
import { Metadata } from './metadata';
import { META_KEY } from './token';
import { MetaDataModel } from './state';

class StateContextImp<T = any> implements StateContext<T> {
  #store: Store<string, any>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  set store(value: StoreDefinition<string, any, {}, {}>) {
    this.#store = value();
  }

  dispatch(actions: ActionDef | ActionDef[]): Promise<void> {
    return Promise.resolve(undefined);
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
  // const options: StoreOptions<any> = Metadata.getMetadata(META_OPTIONS_KEY, state) || ({} as StoreOptions<any>);
  const metadata: MetaDataModel = Metadata.getMetadata(META_KEY, state) || ({} as MetaDataModel);
  console.log(
    Object.entries(metadata.getters).reduce(
      (previousValue, currentValue) =>
        Object.assign(previousValue, {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          [currentValue[0]]: state[currentValue[1].fn],
        }),
      {},
    ),
  );

  const stateContextImp = new StateContextImp();

  const store = defineStore(metadata.name, {
    state: () => ({ d: metadata.defaults }),
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

  stateContextImp.store = store;
}
