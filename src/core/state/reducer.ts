import { cloneDeep } from 'lodash';

import type { ManaColor } from '../costs/mana-costs';
import type {
  CardId,
  PlayerId,
  StackObjectId,
  TargetId,
} from '../primitives/id';
import { handleActivateAbility } from './handlers/activate-ability';
import handleAdvanceToNextStep from './handlers/advance-to-next-step';
import { handleCastSpell } from './handlers/cast-spell';
import handleDrawCard from './handlers/draw-card';
import handlePlayLand from './handlers/play-land';
import handleResolveTopOfStack from './handlers/resolve-top-of-stack';
import handleTapPermanentForMana from './handlers/tap-permanent-for-mana';
import type { GameState } from './state';

export interface ReduceContext {
  state: GameState;
  events: GameEvent[];
  emit(event: GameEvent): void;
}

type ZoneName = 'hand' | 'battlefield' | 'graveyard' | 'library' | 'stack';

export type AvailablePlayerDecision =
  | { type: 'CAST_SPELL'; cardId: CardId; targets?: TargetId[] }
  | { type: 'PLAY_LAND'; cardId: CardId }
  | { type: 'TAP_PERMANENT_FOR_MANA'; cardId: CardId }
  | {
      type: 'ACTIVATE_ABILITY';
      cardId: CardId;
      abilityIndex: number;
      targets?: TargetId[];
    }
  | { type: 'PASS_PRIORITY' }
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
      type: 'ABILITY_ACTIVATED';
      playerId: PlayerId;
      cardId: CardId;
      abilityIndex: number;
      stackObjectId: StackObjectId;
      targets: TargetId[];
    }
  | {
      type: 'MANA_ABILITY_ACTIVATED';
      playerId: PlayerId;
      cardId: CardId;
      abilityIndex: number;
    }
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
  | {
      type: 'ACTIVATE_ABILITY';
      playerId: PlayerId;
      cardId: CardId;
      abilityIndex: number;
      targets?: TargetId[];
    }
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
    case 'ACTIVATE_ABILITY': {
      handleActivateAbility(ctx, action);
      break;
    }
    case 'ADVANCE_TO_NEXT_STEP': {
      handleAdvanceToNextStep(ctx, action);
      break;
    }
  }

  return { state: ctx.state, events: ctx.events };
}

export function makeContext(state: GameState): ReduceContext {
  return {
    state: cloneDeep(state),
    events: [],
    emit(event) {
      this.events.push(event);
    },
  };
}
