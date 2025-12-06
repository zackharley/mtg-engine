import { PlayerId } from '../primitives/id';
import {
  Phase,
  Step,
  PHASE_STEPS,
  getNextStep,
  getNextPhase,
} from './turn-structure';

/**
 * Represents the current turn state in the game.
 * Tracks which player's turn it is, what phase and step we're in, and the turn number.
 */
export interface TurnState {
  /** The player whose turn it currently is */
  activePlayerId: PlayerId;
  /** The current phase of the turn */
  phase: Phase;
  /** The current step within the phase, or null if the phase has no steps */
  step: Step | null;
  /** The turn number (starts at 1 for the starting player's first turn) */
  turnNumber: number;
  /** Number of lands played this turn by the active player. Default limit is 1 per turn. */
  landPlayedThisTurn: number;
}

/**
 * Creates the initial turn state for the starting player.
 */
export function createInitialTurnState(startingPlayerId: PlayerId): TurnState {
  return {
    activePlayerId: startingPlayerId,
    phase: Phase.BEGINNING,
    step: Step.UNTAP,
    turnNumber: 1,
    landPlayedThisTurn: 0,
  };
}

/**
 * Advances to the next step within the current phase, or to the next phase if no more steps.
 * Returns the updated turn state.
 */
export function advanceToNextStep(turnState: TurnState): TurnState {
  const nextStep = getNextStep(turnState.phase, turnState.step);

  if (nextStep !== null) {
    // Move to next step in current phase
    return {
      ...turnState,
      step: nextStep,
    };
  }

  // Move to next phase
  const nextPhase = getNextPhase(turnState.phase);
  const nextPhaseSteps = PHASE_STEPS[nextPhase] || [];
  const nextStepInNewPhase =
    nextPhaseSteps.length > 0 ? nextPhaseSteps[0] : null;

  // If wrapping to beginning phase, reset landPlayedThisTurn
  if (nextPhase === Phase.BEGINNING && turnState.phase !== Phase.BEGINNING) {
    return {
      ...turnState,
      phase: nextPhase,
      step: nextStepInNewPhase,
      landPlayedThisTurn: 0,
    };
  }

  return {
    ...turnState,
    phase: nextPhase,
    step: nextStepInNewPhase,
  };
}
