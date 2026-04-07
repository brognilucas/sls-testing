/**
 * Makes all properties in T and nested objects optional recursively.
 * Arrays, Date, RegExp and primitives are treated as leaf types.
 */
export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends Date | RegExp | Buffer
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T
