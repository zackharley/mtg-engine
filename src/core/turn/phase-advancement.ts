import type { PlayerId } from '../primitives/id';
import { isEmptyOrderedStack } from '../primitives/ordered-stack';
import { allPlayersHavePassedPriority } from '../priority/priortity';
import type { GameAction } from '../state/reducer';
import type { GameState } from '../state/state';
import { advanceToNextStep as advanceTurnStateStep } from './turn-state';
import { Phase, stepGrantsPriority } from './turn-structure';

/**
 * Determines if the current phase/step should advance.
 * Based on rule 500.2: phases/steps end when stack is empty and all players pass.
 * Based on rule 500.3: steps without priority end when turn-based actions complete.
 */
export function shouldAdvancePhaseOrStep(state: GameState): boolean {
  const { step } = state.turn;

  if (step === null) {
    // Phase has no steps - check if we should advance phase
    return shouldAdvancePhase(state);
  }

  if (!stepGrantsPriority(step)) {
    // Step without priority ends immediately after turn-based actions
    return true;
  }

  // Step with priority ends when stack is empty and all players pass
  return (
    isEmptyOrderedStack(state.stack) && allPlayersHavePassedPriority(state)
  );
}

/**
 * Determines if the current phase should advance.
 * Phases end when stack is empty and all players pass (rule 500.2).
 */
function shouldAdvancePhase(state: GameState): boolean {
  return (
    isEmptyOrderedStack(state.stack) && allPlayersHavePassedPriority(state)
  );
}

/**
 * Creates an action to advance to the next step or phase.
 * Returns null if no advancement is needed.
 */
export function createAdvancementAction(state: GameState): GameAction | null {
  if (!shouldAdvancePhaseOrStep(state)) {
    return null;
  }

  return { type: 'ADVANCE_TO_NEXT_STEP' };
}

/**
 * Advances the turn state to the next step or phase.
 * Handles wrapping to next player's turn when appropriate.
 *
 * Turn number increments only when wrapping back to the starting player,
 * representing a full round where all players have taken their turns.
 */
export function advanceTurnState(
  state: GameState,
  playerOrder: PlayerId[],
): GameState {
  const { turn } = state;
  const nextTurnState = advanceTurnStateStep(turn);

  // If we wrapped to beginning phase, advance to next player
  if (
    nextTurnState.phase === Phase.BEGINNING &&
    state.turn.phase !== Phase.BEGINNING
  ) {
    const currentPlayerIndex = playerOrder.indexOf(turn.activePlayerId);
    const nextPlayerIndex =
      currentPlayerIndex === -1 || currentPlayerIndex === playerOrder.length - 1
        ? 0
        : currentPlayerIndex + 1;
    const nextPlayerId = playerOrder[nextPlayerIndex];

    // Only increment turn number when wrapping back to the starting player
    // This represents a full round where all players have taken their turns
    const shouldIncrementTurnNumber = nextPlayerId === turn.startingPlayerId;

    return {
      ...state,
      turn: {
        ...nextTurnState,
        activePlayerId: nextPlayerId,
        startingPlayerId: turn.startingPlayerId, // Preserve starting player
        turnNumber: shouldIncrementTurnNumber
          ? turn.turnNumber + 1
          : turn.turnNumber,
      },
    };
  }

  return {
    ...state,
    turn: nextTurnState,
  };
}
