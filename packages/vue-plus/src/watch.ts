import { WatchOptions, ComputedRef, Ref, isRef } from 'vue';

type WatchSource<T = any> = Ref<T> | ComputedRef<T> | ((context: T) => T) | string;

type MultiWatchSources = (WatchSource<unknown> | object)[];

export function Watch<Immediate extends Readonly<boolean> = false>(options?: WatchOptions<Immediate>): MethodDecorator;
export function Watch<Immediate extends Readonly<boolean> = false>(
  property: string,
  options?: WatchOptions<Immediate>,
): MethodDecorator;
export function Watch<T, Immediate extends Readonly<boolean> = false>(
  callback: (context: T) => any,
  options?: WatchOptions<Immediate>,
): MethodDecorator;
// export function Watch<T, Immediate extends Readonly<boolean> = false>(
//   callback: (context: T) => any,
//   options?: WatchOptions<Immediate>,
// ): MethodDecorator;
export function Watch<T extends MultiWatchSources, Immediate extends Readonly<boolean> = false>(
  sources: [...T],
  options?: WatchOptions<Immediate>,
): MethodDecorator;
export function Watch<T>(param?: any, o?: any): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const methods = descriptor.value;
    let watchKey = typeof param === 'string' ? param : '';

    const watch = Reflect.get(target, 'WATCH') || {};

    if (typeof param === 'string' && param.endsWith('Change')) {
      watchKey = param.replace(/Change$/, '');
    }

    watch[propertyKey] = {
      property: propertyKey,
      methods,
      callback: typeof param === 'function' ? param : null,
      watchKey,
      multiSources: Array.isArray(param) ? param : [],
      options: o,
    };

    Reflect.set(target, 'WATCH', watch);
  };
}

export function watchWrap(target: object) {
  const prototype = Object.getPrototypeOf(target);
  const watch = Reflect.get(prototype, 'WATCH') || {};
  return Object.values(watch)
    .map((value: any) => {
      let sources;

      if (value.watchKey) {
        // @ts-ignore
        const watchValue = target[value.watchKey];

        if (value.watchKey in target) {
          console.warn(
            `[${target.constructor.name}] 监听器: ${value.property} 中被监听的属性[${value.watchKey}] 不在[${target.constructor.name}]中 将被忽略`,
          );
          return;
        }

        if (!isRef(watchValue)) {
          console.warn(
            `[${target.constructor.name}] 监听器: ${value.property} 中被监听的属性[${value.watchKey}] 不是Ref 将被忽略`,
          );
          return;
        }

        sources = watchValue;
      } else if (value.callback) {
        sources = () => value.callback(target);
      } else if (Array.isArray(value.multiSources) && value.multiSources.length) {
        sources = value.multiSources
          .map((v) => {
            if (typeof v === 'string') {
              // @ts-ignore
              const watchValue = target[value.watchKey];

              if (value.watchKey in target) {
                console.warn(
                  `[${target.constructor.name}] 监听器: ${value.property} 中被监听的属性[${value.watchKey}] 不在[${target.constructor.name}]中 将被忽略`,
                );
                return;
              }

              if (!isRef(watchValue)) {
                console.warn(
                  `[${target.constructor.name}] 监听器: ${value.property} 中被监听的属性[${value.watchKey}] 不是Ref 将被忽略`,
                );
                return;
              }

              return watchValue;
            } else if (value.callback) {
              return () => value.callback(target);
            }
          })
          .filter((v) => !!v);

        if (value.multiSources.length !== sources.length) {
          return;
        }
      }

      return {
        watchCallback: value.methods.bind(target),
        options: value.options,
        sources,
      };
    })
    .filter((v) => !!v);
}
