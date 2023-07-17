export interface ActionDef<T = any, U = any> {
  type: string;

  new (...args: T[]): U;
}

export type ActionType = ActionDef | { type: string };

export interface StateContext<T> {
  getState(): T;

  setState(val: T): T;

  patchState(val: Partial<T>): T;

  dispatch(actions: ActionDef | ActionDef[]): Promise<void>;
}
