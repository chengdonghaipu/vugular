const metadata = new WeakMap<object, Record<string, any>>();

export class Metadata {
  static defineMetadata(key: string, meta: any, target: object) {
    const data = metadata.get(target) || {};
    data[key] = meta;
    metadata.set(target, data);
  }

  static getMetadata<T = any>(key: string, target: object): T | undefined {
    const data = metadata.get(target) || {};

    return data[key];
  }
}
