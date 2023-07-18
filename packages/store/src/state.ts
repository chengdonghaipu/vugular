import { META_KEY, META_OPTIONS_KEY, STATE_ACTIONS, STATE_GETTERS } from './token';
import { Metadata } from './metadata';
import { ActionDef } from './symbols';

export type StateClass<T = any> = new (...args: any[]) => T;

export interface StateClassInternal<T = any, U = any> extends StateClass<T> {
  [META_KEY]?: MetaDataModel;
  [META_OPTIONS_KEY]?: StoreOptions<U>;
}

export interface StoreOptions<T> {
  // StateToken<T>
  name: string;

  defaults?: T;
}

export interface GetterHandlerMetaData {
  fn: string | symbol;
  // options: ActionOptions;
  // type: string;
}
export interface ActionHandlerMetaData {
  fn: string | symbol;
  // options: ActionOptions;
  // type: string;
  actions: ActionDef | ActionDef[];
}

export interface PlainObjectOf<T> {
  [key: string]: T;
}
export interface MetaDataModel {
  name: string;
  actions: PlainObjectOf<ActionHandlerMetaData>;
  getters: PlainObjectOf<GetterHandlerMetaData>;
  defaults: any;
  // path: string | null;
  // makeRootSelector: SelectorFactory | null;
  // children?: StateClassInternal[];
}
export function getStoreMetadata(target: StateClassInternal): MetaDataModel {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return target[META_KEY]!;
}
export function ensureStoreMetadata(target: StateClassInternal): MetaDataModel {
  // eslint-disable-next-line no-prototype-builtins
  if (!target.hasOwnProperty(META_KEY)) {
    const defaultMetadata: MetaDataModel = {
      name: 'NAN',
      actions: {},
      defaults: {},
      getters: {},
      // path: null,
      // makeRootSelector(context: RuntimeSelectorContext) {
      //   return context.getStateGetter(defaultMetadata.name);
      // },
      // children: []
    };

    defaultMetadata.actions = Metadata.getMetadata(STATE_ACTIONS, target) || {};
    defaultMetadata.getters = Metadata.getMetadata(STATE_GETTERS, target) || {};

    Metadata.defineMetadata(META_KEY, defaultMetadata, target);
  }
  return getStoreMetadata(target);
}

export function State<T>(options: StoreOptions<T>) {
  return (target: StateClass): void => {
    const stateClass: StateClassInternal = target;
    ensureStoreMetadata(stateClass);
    const metadata: MetaDataModel = Metadata.getMetadata(META_KEY, target) || ({} as MetaDataModel);
    metadata.name = options.name;
    metadata.defaults = options.defaults;
    // const meta: MetaDataModel = ensureStoreMetadata(stateClass);
    // const inheritedStateClass: StateClassInternal = Object.getPrototypeOf(stateClass);
    // const optionsWithInheritance: StoreOptions<T> = getStateOptions(inheritedStateClass, options);
    // mutateMetaData<T>({ meta, inheritedStateClass, optionsWithInheritance });
    // stateClass[META_OPTIONS_KEY] = options;
    Metadata.defineMetadata(META_OPTIONS_KEY, options, target);
  };
}
