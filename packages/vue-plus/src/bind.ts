export function BindThis(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (this: any, ...args: any[]) {
    const boundMethod = originalMethod.bind(this);
    return boundMethod(...args);
  };

  return descriptor;
}
