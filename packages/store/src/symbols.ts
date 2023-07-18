export interface ActionDef<T = any, U = any> {
  type: string;

  new (...args: T[]): U;
}

export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export type ActionType = ActionDef | { type: string };

export interface StateContext<T> {
  getState(): T;

  setState(val: T): T;

  patchState(val: Partial<T>): T;

  dispatch(actions: ActionDef | ActionDef[]): Promise<void>;
}
