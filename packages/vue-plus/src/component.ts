import type {ComponentPublicInstance, InjectionKey} from "vue";
import type {ReactiveEffect, TrackOpTypes, TriggerOpTypes} from "vue";

export interface Type<T> extends Function {
    new(...args: any[]): T;
}

export interface TypeDecorator {
    <T extends Type<any>>(type: T): T;

    (target: Object, propertyKey?: string|symbol, parameterIndex?: number): void;
}

export interface ComponentDecorator {
    (obj: Component): TypeDecorator;
    new(obj: Component): Component;
}

export interface InjectDecorator {
    (token: any): any;
    new(token: any): any;
}

type DebuggerEvent = {
    effect: ReactiveEffect
    target: object
    type: TrackOpTypes /* 'get' | 'has' | 'iterate' */
    key: any
}

type DebuggerRenderEvent = {
    effect: ReactiveEffect
    target: object
    type: TriggerOpTypes /* 'set' | 'add' | 'delete' | 'clear' */
    key: any
    newValue?: any
    oldValue?: any
    oldTarget?: Map<any, any> | Set<any>
}
export interface LifecycleHook {
    onMounted?(): void

    onUpdated?(): void

    onUnmounted?(): void

    onBeforeMount?(): void

    onBeforeUpdate?(): void

    onBeforeUnmount?(): void

    onErrorCaptured?(err: unknown, instance: ComponentPublicInstance | null, info: string): boolean | void

    onRenderTracked?(e: DebuggerEvent): void

    onRenderTriggered?(e: DebuggerRenderEvent): void

    onActivated?(): void

    onDeactivated?(): void

    onServerPrefetch?(): Promise<any>
}

export function InjectionToken<T = any>(desc?: string): InjectionKey<T> {
    return Symbol(desc)
}
export interface ValueSansProvider {
    useValue: any;
}

export declare interface ValueProvider extends ValueSansProvider {
    provide: any;
    multi?: boolean;
}


export interface TypeProvider extends Type<any> {
}

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
    providers?: Provider[],
    components?: any[]
}

export function Ref(): PropertyDecorator {
    return function () {

    }
}

export const Component: ComponentDecorator = null as unknown as ComponentDecorator
export const Inject: InjectDecorator = function (token: string): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => void 0
} as unknown as InjectDecorator
export const Host = function (): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => void 0
}
export const SkipSelf = function (): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => void 0
}
export const Self = function (): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => void 0
}
export const Optional = function (): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => void 0
}