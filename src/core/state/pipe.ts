import type { Draft } from 'immer';

type DraftMutation<T> = (draft: Draft<T>) => Draft<T>;

export function pipe<T>(
  draft: Draft<T>,
  ...mutations: DraftMutation<T>[]
): Draft<T> {
  return mutations.reduce((acc, mutation) => mutation(acc), draft);
}
