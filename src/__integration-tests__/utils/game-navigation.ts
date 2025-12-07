import type { GameController } from '../../core/engine/game-controller';
import type { PlayerId } from '../../core/primitives/id';
import type { GameState } from '../../core/state/state';
import type { Phase, Step } from '../../core/turn/turn-structure';

/**
 * Helper function to pass priority until the game reaches a specific phase and step.
 * Optionally waits for a specific active player to be active.
 *
 * @param controller - The game controller managing the game state
 * @param targetPhase - The phase to advance to
 * @param targetStep - The step to advance to (or null for phases without steps)
 * @param options - Optional configuration
 * @param options.activePlayerId - If provided, waits until this player is the active player
 * @param options.maxIterations - Maximum number of priority passes before throwing an error (default: 200)
 * @throws Error if the target phase/step isn't reached within maxIterations
 */
export function passUntilPhaseStep(
  controller: GameController,
  targetPhase: Phase,
  targetStep?: Step | null,
  options: {
    activePlayerId?: PlayerId;
    maxIterations?: number;
  } = {},
): void {
  const { activePlayerId, maxIterations = 200 } = options;
  let iterations = 0;

  while (iterations < maxIterations) {
    const state = controller.getState();

    if (hasReachedTarget(state, targetPhase, targetStep, activePlayerId)) {
      return;
    }

    if (handleDecisionIfWaiting(controller)) {
      iterations++;
      continue;
    }

    if (iterations === 0) {
      throw new Error(
        'Engine is not waiting for decision and target phase/step not reached',
      );
    }

    iterations++;
  }

  const finalState = controller.getState();
  throw new Error(
    `Failed to reach target phase/step after ${maxIterations} iterations. ` +
      `Target: ${targetPhase}/${targetStep}${activePlayerId ? ` (active player: ${activePlayerId})` : ''}, ` +
      `Current: ${finalState.turn.phase}/${finalState.turn.step} (active player: ${finalState.turn.activePlayerId}), ` +
      `Waiting for decision: ${controller.isWaitingForDecision()}`,
  );
}

function hasReachedTarget(
  state: GameState,
  targetPhase: Phase,
  targetStep: Step | null | undefined,
  activePlayerId: PlayerId | undefined,
): boolean {
  const phaseMatches = state.turn.phase === targetPhase;
  const stepMatches = state.turn.step === targetStep;
  const playerMatches =
    activePlayerId === undefined ||
    state.turn.activePlayerId === activePlayerId;

  return phaseMatches && stepMatches && playerMatches;
}

function handleDecisionIfWaiting(controller: GameController): boolean {
  if (!controller.isWaitingForDecision()) {
    return false;
  }

  const playerNeedingDecision = controller.getPlayerNeedingDecision();
  if (playerNeedingDecision) {
    controller.provideDecision({ type: 'PASS_PRIORITY' });
    return true;
  }

  return false;
}
