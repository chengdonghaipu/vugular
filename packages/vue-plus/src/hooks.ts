interface HooksReturn {
  new <A>(): A;
  new <A, B>(): A & B;
  new <A, B, C>(): A & B & C;
  new <A, B, C, D>(): D & A & B & C;
  new <A, B, C, D, E>(): E & D & A & B & C;
  new <A, B, C, D, E, F>(): E & D & A & B & C & F;
  new <A, B, C, D, E, F, G>(): E & D & A & B & C & F & G;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const HookReturns: HooksReturn = class {};

export function hooksCompose<T extends object, U>(target: T, source: U) {
  Object.assign(target, source);
}
