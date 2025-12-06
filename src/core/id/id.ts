import crypto from 'node:crypto';

export type IdType = 'card' | 'player' | 'trigger';
export type Id = `${IdType}-${string}`;

export function makeId(type: IdType): Id {
  return `${type}-${crypto.randomUUID()}`;
}
