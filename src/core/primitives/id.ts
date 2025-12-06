import crypto from 'node:crypto';

type IdType =
  | 'card'
  | 'player'
  | 'trigger'
  | 'ability'
  | 'target'
  | 'card-definition'
  | 'stack-object';

type Id<T extends IdType> = string & { __brand: T };

// ID primitives
export type CardId = Id<'card'>;
export type PlayerId = Id<'player'>;
export type TriggerId = Id<'trigger'>;
export type AbilityId = Id<'ability'>;
export type CardDefinitionId = Id<'card-definition'>;
export type StackObjectId = Id<'stack-object'>;

// Composite IDs
export type TargetId = CardId | PlayerId;

// Type mapping from IdType string literals to branded types
interface IdTypeMap {
  card: CardId;
  player: PlayerId;
  trigger: TriggerId;
  ability: AbilityId;
  'card-definition': CardDefinitionId;
  'stack-object': StackObjectId;
}

function makeId<T extends keyof IdTypeMap>(type: T): IdTypeMap[T] {
  return `${type}-${crypto.randomUUID()}` as IdTypeMap[T];
}

function createIdFactory<T extends keyof IdTypeMap>(
  type: T,
): () => IdTypeMap[T] {
  return () => makeId(type);
}

export const makeCardId = createIdFactory('card');
export const makePlayerId = createIdFactory('player');
export const makeTriggerId = createIdFactory('trigger');
export const makeAbilityId = createIdFactory('ability');
export const makeCardDefinitionId = createIdFactory('card-definition');
export const makeStackObjectId = createIdFactory('stack-object');
