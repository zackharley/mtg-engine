import { produce } from 'immer';
import { GameState } from '../state/state';
import { Step } from './turn-structure';
import { drawCard } from '../deck/deck';
import { ManaColor } from '../costs/mana-costs';
import { PlayerId } from '../primitives/id';
import { isEmptyOrderedStack } from '../primitives/ordered-stack';

/**
 * Performs turn-based actions for a given step.
 * Based on rule 703: Turn-Based Actions.
 * Turn-based actions happen automatically and don't use the stack.
 *
 * @param state - Current game state
 * @param step - The step to process turn-based actions for
 * @returns Updated game state after turn-based actions
 */
export function performTurnBasedActions(
  state: GameState,
  step: Step,
): GameState {
  const { activePlayerId } = state.turn;

  switch (step) {
    case Step.UNTAP:
      return performUntapStep(state);

    case Step.DRAW:
      return performDrawStep(state, activePlayerId);

    case Step.END:
    case Step.CLEANUP:
      // Empty mana pools at end of phase/step (rule 500.5)
      return emptyManaPools(state);

    default:
      // No turn-based actions for other steps
      return state;
  }
}

/**
 * Performs untap step turn-based actions.
 * Based on rule 502: Untap Step.
 * - Phasing (rule 502.1) - skipped for now
 * - Day/night check (rule 502.2) - skipped for now
 * - Untap permanents (rule 502.3)
 */
function performUntapStep(state: GameState): GameState {
  const { activePlayerId } = state.turn;
  const player = state.players[activePlayerId];

  return produce(state, (draft) => {
    // Untap all permanents controlled by active player
    for (const cardId of player.battlefield) {
      const card = draft.cards[cardId];
      if (card) {
        card.tapped = false;
      }
    }
  });
}

/**
 * Performs draw step turn-based actions.
 * Based on rule 504: Draw Step.
 * - Active player draws a card (rule 504.1)
 */
function performDrawStep(
  state: GameState,
  activePlayerId: PlayerId,
): GameState {
  const player = state.players[activePlayerId];
  if (!player) {
    return state;
  }

  // Only draw if library has cards (rule 121.3)
  if (isEmptyOrderedStack(player.library)) {
    return state;
  }

  return drawCard(state, activePlayerId);
}

/**
 * Empties all mana pools.
 * Based on rule 500.5: mana empties at end of phase/step.
 */
function emptyManaPools(state: GameState): GameState {
  return produce(state, (draft) => {
    const manaColors: ManaColor[] = ['W', 'U', 'B', 'R', 'G'];
    const playerIds = Object.keys(draft.players) as PlayerId[];
    for (const playerId of playerIds) {
      const player = draft.players[playerId];
      for (const color of manaColors) {
        player.manaPool[color] = 0;
      }
    }
  });
}
