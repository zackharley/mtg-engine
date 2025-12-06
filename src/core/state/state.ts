import { CardDefinitionId, CardId, PlayerId } from '../primitives/id';
import { ManaColor } from '../costs/mana-costs';
import { Card, CardDefinition } from '../card/card';
import { GameAction } from './reducer';
import { allPlayersHavePassedPriority } from '../priority/priortity';
import { Stack } from '../stack/stack';
import { OrderedStack, isEmptyOrderedStack } from '../primitives/ordered-stack';
import { TurnState } from '../turn/turn-state';
import { createAdvancementAction } from '../turn/phase-advancement';
import { performTurnBasedActions } from '../turn/turn-based-actions';

export interface GameState {
  players: Record<PlayerId, PlayerState>;
  cards: Record<CardId, Card>;
  cardDefinitions: Record<CardDefinitionId, CardDefinition>;
  stack: Stack;
  turn: TurnState;
  /** Set to true when a player explicitly ends the game */
  gameEnded: boolean;
  /** Set of player IDs who have passed priority this round */
  playersWhoPassedPriority: Set<PlayerId>;
}

interface PlayerState {
  life: number;
  manaPool: Record<ManaColor, number>;
  hand: CardId[];
  battlefield: CardId[];
  graveyard: OrderedStack<CardId>;
  library: OrderedStack<CardId>;
}

export type ZoneName =
  | 'hand'
  | 'battlefield'
  | 'graveyard'
  | 'library'
  | 'stack'
  | 'exile'
  | 'command';

export function isGameOver(state: GameState): boolean {
  // Check if game was explicitly ended by a player
  if (state.gameEnded) {
    return true;
  }

  // Check if only one player is left alive
  const players = Object.values(state.players);
  const alivePlayers = players.filter((player) => player.life > 0);
  if (alivePlayers.length === 1) {
    return true;
  }

  return false;
}

/**
 * Determines the next engine action to take.
 * Based on rule 703: Turn-Based Actions happen first, then state-based actions,
 * then triggered abilities, then players receive priority.
 */
export function nextEngineAction(state: GameState): GameAction | null {
  // Check if we should advance phase/step
  const advancementAction = createAdvancementAction(state);
  if (advancementAction) {
    return advancementAction;
  }

  // Check if stack should resolve
  if (
    allPlayersHavePassedPriority(state) &&
    !isEmptyOrderedStack(state.stack)
  ) {
    return { type: 'RESOLVE_TOP_OF_STACK' };
  }

  return null;
}

/**
 * Processes turn-based actions for the current step if needed.
 * Should be called when entering a new step.
 * Based on rule 703.3: turn-based actions happen before state-based actions,
 * triggered abilities, and priority.
 */
export function processTurnBasedActions(state: GameState): GameState {
  if (state.turn.step === null) {
    return state;
  }

  return performTurnBasedActions(state, state.turn.step);
}
