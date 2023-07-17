export type StateClass<T = any> = new (...args: any[]) => T;
export const META_KEY = 'NGXS_META';
export const META_OPTIONS_KEY = 'NGXS_OPTIONS_META';
export interface StateClassInternal<T = any, U = any> extends StateClass<T> {
  [META_KEY]?: MetaDataModel;
  [META_OPTIONS_KEY]?: StoreOptions<U>;
}

export interface StoreOptions<T> {
  // StateToken<T>
  name: string;

  defaults?: T;
}

export interface ActionHandlerMetaData {
  fn: string | symbol;
  // options: ActionOptions;
  type: string;
}

export interface PlainObjectOf<T> {
  [key: string]: T;
}
export interface MetaDataModel {
  name: string | null;
  actions: PlainObjectOf<ActionHandlerMetaData[]>;
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
      name: null,
      actions: {},
      defaults: {},
      // path: null,
      // makeRootSelector(context: RuntimeSelectorContext) {
      //   return context.getStateGetter(defaultMetadata.name);
      // },
      // children: []
    };

    Object.defineProperty(target, META_KEY, { value: defaultMetadata });
  }
  return getStoreMetadata(target);
}

export function State<T>(options: StoreOptions<T>) {
  return (target: StateClass): void => {
    const stateClass: StateClassInternal = target;
    ensureStoreMetadata(stateClass);
    // const meta: MetaDataModel = ensureStoreMetadata(stateClass);
    // const inheritedStateClass: StateClassInternal = Object.getPrototypeOf(stateClass);
    // const optionsWithInheritance: StoreOptions<T> = getStateOptions(inheritedStateClass, options);
    // mutateMetaData<T>({ meta, inheritedStateClass, optionsWithInheritance });
    stateClass[META_OPTIONS_KEY] = options;
  };
}
