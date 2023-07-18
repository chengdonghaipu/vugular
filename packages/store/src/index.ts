import { useState } from './use';

export { State } from './state';
export { Getter } from './getter';
export { Action } from './action';
export type { StateContext } from './symbols';
export { Select } from './select';
import { Store } from './store';

Reflect.set(window, 'STORE_USE_STATE', useState);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const rootInjector = window.__rootInjector__;
if (rootInjector && !rootInjector.get(Store, null, { optional: true })) {
  rootInjector.resolveProvider([Store]);
}

export { Store };
