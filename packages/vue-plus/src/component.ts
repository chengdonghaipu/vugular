import type { ComponentPublicInstance, InjectionKey } from 'vue';
import type { ReactiveEffect, TrackOpTypes, TriggerOpTypes } from 'vue';
import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import type { NavigationGuard } from "vue-router";
import { onBeforeRouteUpdate } from "vue-router";


export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export interface TypeDecorator {
  <T extends Type<any>>(type: T): T;

  // eslint-disable-next-line @typescript-eslint/ban-types
  (target: Object, propertyKey?: string | symbol, parameterIndex?: number): void;
}

export interface ComponentDecorator {
  (obj: Component): TypeDecorator;
  new (obj: Component): Component;
}

export interface InjectDecorator {
  (token: any): any;
  new (token: any): any;
}

type DebuggerEvent = {
  effect: ReactiveEffect;
  target: object;
  type: TrackOpTypes /* 'get' | 'has' | 'iterate' */;
  key: any;
};

type DebuggerRenderEvent = {
  effect: ReactiveEffect;
  target: object;
  type: TriggerOpTypes /* 'set' | 'add' | 'delete' | 'clear' */;
  key: any;
  newValue?: any;
  oldValue?: any;
  oldTarget?: Map<any, any> | Set<any>;
};
export interface RouterLifecycleHook {

}
interface BaseLifecycleHook {
  onMounted?(): void;
  onSetup?(): any;
  onUpdated?(): void;
  onUnmounted?(): void;
  onBeforeMount?(): void;
  onBeforeUpdate?(): void;
  onBeforeUnmount?(): void;
  onErrorCaptured?(err: unknown, instance: ComponentPublicInstance | null, info: string): boolean | void;
  onRenderTracked?(e: DebuggerEvent): void;
  onRenderTriggered?(e: DebuggerRenderEvent): void;
  onDeactivated?(): void;
  onServerPrefetch?(): Promise<any>;

  onBeforeRouteLeave?(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ): ReturnType<NavigationGuard>;
  onBeforeRouteUpdate?(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ): ReturnType<NavigationGuard>;
}
// eslint-disable-next-line @typescript-eslint/ban-types
export type LifecycleHook = BaseLifecycleHook;

export function InjectionToken<T = any>(desc?: string): InjectionKey<T> {
  return Symbol(desc);
}
export interface ValueSansProvider {
  useValue: any;
}

export declare interface ValueProvider extends ValueSansProvider {
  provide: any;
  multi?: boolean;
}

export type TypeProvider = Type<any>;

export declare interface ClassSansProvider {
  useClass: Type<any>;
}

export declare interface ClassProvider extends ClassSansProvider {
  provide: any;
  multi?: boolean;
}

export type FactoryProvider<T = any> = {
  provide: any;
  useFactory: (...args: any[]) => T;
  deps?: any[];
  multi?: boolean;
};

export type Provider = TypeProvider | ValueProvider | ClassProvider | FactoryProvider;
export interface Component {
  templateUrl?: string;
  template?: string;
  styleUrls?: string[];
  selector?: string;
  styles?: string[];
  providers?: Provider[];
  components?: any[];
}

export function Ref(): PropertyDecorator {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return function () {};
}

export const Component: ComponentDecorator = null as unknown as ComponentDecorator;
export const Inject: InjectDecorator = function (token: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => void 0;
} as unknown as InjectDecorator;
export const Host = function (): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => void 0;
};
export const SkipSelf = function (): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => void 0;
};
export const Self = function (): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => void 0;
};
export const Optional = function (): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => void 0;
};
