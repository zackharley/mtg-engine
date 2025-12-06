import { cloneDeep } from 'lodash';
import { CardId, PlayerId, StackObjectId, TargetId } from '../primitives/id';
import { handleCastSpell } from './handlers/cast-spell';
import handleResolveTopOfStack from './handlers/resolve-top-of-stack';
import { GameState } from './state';
import handleDrawCard from './handlers/draw-card';
import handlePlayLand from './handlers/play-land';
import handleTapPermanentForMana from './handlers/tap-permanent-for-mana';
import handleAdvanceToNextStep from './handlers/advance-to-next-step';
import { ManaColor } from '../costs/mana-costs';

export interface ReduceContext {
  state: GameState;
  events: GameEvent[];
  emit(event: GameEvent): void;
}

type ZoneName = 'hand' | 'battlefield' | 'graveyard' | 'library' | 'stack';

export type AvailablePlayerDecision =
  | { type: 'DRAW_CARD' }
  | { type: 'CAST_SPELL'; cardId: CardId; targets?: TargetId[] }
  | { type: 'PLAY_LAND'; cardId: CardId }
  | { type: 'TAP_PERMANENT_FOR_MANA'; cardId: CardId }
  | { type: 'PASS' }
  | { type: 'END_GAME' };

export type GameEvent =
  | {
      type: 'SPELL_CAST';
      playerId: PlayerId;
      cardId: CardId;
      stackObjectId: StackObjectId;
      targets: TargetId[];
    }
  | { type: 'SPELL_RESOLVED'; playerId: PlayerId; cardId: CardId }
  | { type: 'CARD_MOVED'; cardId: CardId; from: ZoneName; to: ZoneName }
  | { type: 'MANA_ADDED'; playerId: PlayerId; color: ManaColor; amount: number }
  | {
      type: 'DIRECT_DAMAGE_APPLIED';
      sourceCardId: CardId;
      controllerId: PlayerId;
      targetId: TargetId;
      amount: number;
    }
  | { type: 'LIFE_GAINED'; playerId: PlayerId; amount: number }
  | { type: 'KILL_SWITCH_TRIGGERED'; reason: string }
  | {
      type: 'PLAYER_DECISION_REQUESTED';
      playerId: PlayerId;
      availableDecisions: AvailablePlayerDecision[];
    };

export type GameAction =
  | {
      type: 'CAST_SPELL';
      playerId: PlayerId;
      cardId: CardId;
      targets?: TargetId[];
    }
  | { type: 'DRAW_CARD'; playerId: PlayerId }
  | { type: 'PLAY_LAND'; playerId: PlayerId; cardId: CardId }
  | { type: 'TAP_PERMANENT_FOR_MANA'; playerId: PlayerId; cardId: CardId }
  | { type: 'RESOLVE_TOP_OF_STACK' } // engine/driver action
  | { type: 'ADVANCE_TO_NEXT_STEP' };

export function reduce(
  state: GameState,
  action: GameAction,
): { state: GameState; events: GameEvent[] } {
  const ctx = makeContext(state);

  switch (action.type) {
    case 'CAST_SPELL': {
      handleCastSpell(ctx, action);
      break;
    }
    case 'RESOLVE_TOP_OF_STACK': {
      handleResolveTopOfStack(ctx, action);
      break;
    }
    case 'DRAW_CARD': {
      handleDrawCard(ctx, action);
      break;
    }
    case 'PLAY_LAND': {
      handlePlayLand(ctx, action);
      break;
    }
    case 'TAP_PERMANENT_FOR_MANA': {
      handleTapPermanentForMana(ctx, action);
      break;
    }
    case 'ADVANCE_TO_NEXT_STEP': {
      handleAdvanceToNextStep(ctx, action);
      break;
    }
  }

  return { state: ctx.state, events: ctx.events };
}

function makeContext(state: GameState): ReduceContext {
  return {
    state: cloneDeep(state),
    events: [],
    emit(event) {
      this.events.push(event);
    },
  };
}
