import { Id } from '../id/id';
import { GameState } from './state';

export interface ReduceContext {
  state: GameState;
  events: GameEvent[];
  emit(event: GameEvent): void;
}

type ZoneName = 'hand' | 'battlefield' | 'graveyard' | 'library' | 'stack';

export type GameEvent =
  | { type: 'SPELL_CAST'; playerId: Id; cardId: Id; stackObjectId: Id }
  | { type: 'SPELL_RESOLVED'; playerId: Id; cardId: Id }
  | { type: 'CARD_MOVED'; cardId: Id; from: ZoneName; to: ZoneName }
  | { type: 'LIFE_GAINED'; playerId: Id; amount: number };
