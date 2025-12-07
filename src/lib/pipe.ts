type Mutation<T> = (value: T) => T;

export function pipe<T>(value: T, ...mutations: Mutation<T>[]): T {
  return mutations.reduce((acc, mutation) => mutation(acc), value);
}
