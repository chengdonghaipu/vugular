import type { ComponentPublicInstance, InjectionKey } from 'vue';
import type { ClassProvider, FactoryProvider, Provider, Type, TypeProvider, ValueProvider } from './component';
import { getCurrentInstance } from 'vue';
import { NATIVE } from "./const";
import { useRoute, useRouter } from "vue-router";

type InjectFlags = number;

const enum InjectFlagsEnum {
  Optional = 1 << 0,
  Self = 1 << 1,
  Host = 1 << 2,
  SkipSelf = 1 << 3,
}

type InjectOptions = {
  optional?: boolean;
  self?: boolean;
  host?: boolean;
  skipSelf?: boolean;
};

function optionsToFlags(options?: InjectOptions | InjectFlags): InjectFlags {
  if (typeof options === 'number') {
    return options;
  }

  let flags = 0;

  if (options) {
    flags |= options.optional ? InjectFlagsEnum.Optional : 0;
    flags |= options.self ? InjectFlagsEnum.Self : 0;
    flags |= options.host ? InjectFlagsEnum.Host : 0;
    flags |= options.skipSelf ? InjectFlagsEnum.SkipSelf : 0;
  }

  return flags;
}

function isTypeProvider(provider: any): provider is TypeProvider {
  return provider && typeof provider === 'function';
}
function isClassProvider(provider: any): provider is ClassProvider {
  return provider && 'useClass' in provider;
}

function isValueProvider(provider: Provider): provider is ValueProvider {
  return provider && 'useValue' in provider;
}
function isFactoryProvider(provider: Provider): provider is FactoryProvider {
  return provider && 'useFactory' in provider;
}

export class Injector {
  private readonly _records = new Map<any, any>();

  static create(options: { providers: Provider[]; parent?: Injector | null }): Injector {
    const parent = options.parent || null;
    // const resolvedProviders = Injector._resolveProviders(options.providers);

    return new Injector(parent, options.providers);
  }

  constructor(private readonly _parent: Injector | null, private readonly _providers: Provider[] = []) {
    this.resolveProvider(_providers);
  }

  resolveProvider(providers: Provider[]) {
    providers.forEach((provider) => {
      const existing = this._records.get('provide' in provider ? provider.provide : provider);
      if (!('multi' in provider) && existing) {
        throw new Error(`A record for ${'provide' in provider ? provider.provide.toString() : ''} already exists.`);
      }

      const record = this._resolveProvider(provider);

      if (!record) {
        return;
      }

      if (existing && 'multi' in provider && provider.multi) {
        existing.value.push(record.value[0]);
      } else {
        if ('provide' in provider) {
          this._records.set(provider.provide, record);
        } else {
          this._records.set(provider, record);
        }
      }
    });
  }

  private getRecord<T>(token: InjectionKey<T>): Record<string, any> | null {
    const record = this._records.get(token);
    if (record) {
      return record;
    }
    if (this._parent) {
      return this._parent.getRecord(token);
    }
    return null;
  }

  private _resolveProvider(provider: Provider): Record<string, any> | null {
    const token = 'provide' in provider ? provider.provide : provider;
    const record = this.getRecord(token);
    if (record && record.resolved) {
      return record;
    }
    const activeRecord = { provider, providers: null, value: undefined, resolved: false };
    if (isClassProvider(provider)) {
      const propertyDescriptor = Object.getOwnPropertyDescriptor(provider.useClass, '__decorator__');

      if (!propertyDescriptor) {
        activeRecord.value = provider.multi ? [new provider.useClass()] : new provider.useClass();
      } else {
        const paramTypes = propertyDescriptor.value.paramTypes as any[];
        const dependency = paramTypes.map((paramType) => {
          if (!paramType.token) {
            return this.get(paramType, null);
          }

          return this.get(paramType.token, null, paramType.injectOptions);
        });

        activeRecord.value = provider.multi
          ? [new provider.useClass(...dependency)]
          : new provider.useClass(...dependency);
      }
    } else if (isValueProvider(provider)) {
      activeRecord.value = provider.multi ? [provider.useValue] : provider.useValue;
      activeRecord.resolved = true;
    } else if (isFactoryProvider(provider)) {
      activeRecord.value = provider.useFactory(...this._resolveFactories(provider.deps || []));
      activeRecord.resolved = true;
    } else if (isTypeProvider(provider)) {
      const propertyDescriptor = Object.getOwnPropertyDescriptor(provider, '__decorator__');

      if (!propertyDescriptor) {
        activeRecord.value = new provider();
      } else {
        const paramTypes = propertyDescriptor.value.paramTypes as any[];

        const dependency = paramTypes.map((paramType) => {
          if (!paramType.token) {
            return this.get(paramType, null);
          }

          return this.get(paramType.token, null, paramType.injectOptions);
        });

        activeRecord.value = new provider(...dependency);
      }
    } else {
      return null;
    }
    return activeRecord;
  }

  private _resolveFactories(deps: any[]): any[] {
    return deps.map((dep) => {
      const record = this.getRecord(dep.token);
      if (record) {
        return record.value;
      }
    });
  }

  get<T>(token: InjectionKey<T>, notFoundValue?: T, options?: InjectOptions): T;
  get<T>(token: InjectionKey<T>, notFoundValue: null | undefined, options: InjectOptions): T | null;
  get<T>(token: InjectionKey<T>, notFoundValue?: T, options?: InjectOptions): T | null {
    const flags = optionsToFlags(options);

    if (flags & InjectFlagsEnum.SkipSelf) {
      delete options?.skipSelf;
      return this._parent ? this._parent.get(token, notFoundValue, options) : (notFoundValue as T);
    }

    let record = this._records.get(token);
    if (!record && flags & InjectFlagsEnum.Host) {
      // 禁止获取父级以上的依赖
      options = options || {
        self: true,
      };
      record = this._parent && this._parent.get(token, notFoundValue, options);

      if (record) {
        return record;
      }
    } else if (!record && !(flags & InjectFlagsEnum.Self)) {
      record = this._parent && this._parent.get(token, notFoundValue, options);

      if (record) {
        return record;
      }
    }

    if (record) {
      return record.value;
    } else if (!record && !(flags & InjectFlagsEnum.Optional)) {
      throw new Error(`No provider for ${token}`);
    }

    return record && record.value !== undefined ? record.value : notFoundValue !== undefined ? notFoundValue : null;
  }
}

// 创建一个装饰器来标记需要注入依赖项的类
export function Injectable() {
  return function (target: any) {
    // 在类上设置一个静态属性来存储依赖项的 token
    // Object.defineProperty(target, 'inject', {
    //     value: Reflect.getMetadata('design:paramtypes', target) || []
    // });
  };
}

export const rootInjector = Injector.create({
  parent: null,
  providers: [],
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.__rootInjector__ = rootInjector;

function getParentInjector(proxy: ComponentPublicInstance): Injector {
  const parent = proxy.$parent;

  if (!parent) {
    return rootInjector;
  }

  const propertyDescriptor = Object.getOwnPropertyDescriptor(parent, '__injector__');

  if (propertyDescriptor && propertyDescriptor.value) {
    return propertyDescriptor.value;
  }

  return getParentInjector(parent);
}

export function attachInjectableInjector(target: Type<any>) {
  rootInjector.resolveProvider([target]);
  Object.defineProperty(target, '__injector__', {
    value: rootInjector,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

export function attachInjector(target: Type<any>) {
  const { proxy } = getCurrentInstance() || {};

  const parentInjector = getParentInjector(proxy as any);

  const injector = new Injector(parentInjector);
  const propertyDescriptor = Object.getOwnPropertyDescriptor(target, '__decorator__');

  if (propertyDescriptor) {
    const providers: Provider[] = propertyDescriptor.value.providers || [];

    injector.resolveProvider(providers);
  }

  Object.defineProperty(proxy, '__injector__', {
    value: injector,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  // console.log(proxy);

  if (!propertyDescriptor) {
    return Object.assign(new target(), { [NATIVE]: proxy });
  } else {
    const paramTypes = propertyDescriptor.value.paramTypes as any[];

    const dependency = paramTypes.map((paramType) => {
      if (!paramType.token) {
        if (paramType === "vg_Router") {
          const router = useRouter();

          return router;
        }
        if (paramType === "vg_Route") {
          const route = useRoute();

          return route;
        }
        return injector.get(paramType, null);
      }

      return injector.get(paramType.token, null, paramType.injectOptions);
    });

    const t = new target(...dependency);
    // const outputs = propertyDescriptor.value.outputs as any[];
    // const inputs = propertyDescriptor.value.inputs as any[];
    // const models = propertyDescriptor.value.models as any[];

    // if (outputs.length) {
    //   outputs.forEach(v => {
    //     delete t[v.name]
    //   })
    // }
    // if (inputs.length) {
    //   inputs.forEach(v => {
    //     // delete t[v.name]
    //   })
    // }
    // if (models.length) {
    //   models.forEach(v => {
    //     delete t[v.name]
    //   })
    // }

    t[NATIVE] = proxy;
    return t;
  }
}
