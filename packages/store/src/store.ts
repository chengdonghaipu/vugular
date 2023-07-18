import { Type } from './symbols';
import { Metadata } from './metadata';
import { META_KEY, STATE_STORE } from './token';
import { ActionHandlerMetaData, MetaDataModel } from './state';

export class Store {
  use<T>(state: Type<T>) {
    const store = Metadata.getMetadata(STATE_STORE, state);

    if (!store) {
      throw Error(`${state.name} is not registered`);
    }
    // dispatch
    return new (class {
      constructor() {}

      async dispatch(actions: any | any[]): Promise<void> {
        const originParams = Array.isArray(actions) ? actions : [actions];
        if (Array.isArray(actions)) {
          actions = actions.map((action) => action.constructor);
        } else {
          actions = actions.constructor;
        }
        const metadata: MetaDataModel = Metadata.getMetadata(META_KEY, state) || ({} as MetaDataModel);
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
                const result = store[value.fn](originParams[index]);

                if (result instanceof Promise) {
                  return result;
                }

                return Promise.resolve(result);
              }),
            );
          }),
        );
      }

      select() {}
    })();
  }
}
