/**
 * DeepPartial utility type that recursively makes all properties optional.
 * Useful for test overrides where you want to partially override nested objects.
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
