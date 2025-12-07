import { getAvailableDecisions } from '../actions/available-decisions';
import type { PlayerId } from '../primitives/id';
import { getNextPlayerWithPriority } from '../priority/priortity';
import type { GameEvent } from '../state/reducer';
import { reduce } from '../state/reducer';
import type { GameState } from '../state/state';
import { isGameOver, nextEngineAction } from '../state/state';
import { stepGrantsPriority } from '../turn/turn-structure';

export interface RunGameResult {
  finalState: GameState;
  events: GameEvent[];
  needsPlayerDecision: boolean;
  playerIdNeedingDecision?: PlayerId;
}

type EngineEventSink = (events: GameEvent[], state: GameState) => void;

/**
 * Runs the game engine until it needs a player decision or the game ends.
 * Returns a result indicating whether a player decision is needed.
 */
export function runGame(
  initialState: GameState,
  onEvents?: EngineEventSink,
): RunGameResult {
  // Note: We don't call processTurnBasedActions here because:
  // 1. When starting a new game, the initial state is already processed
  // 2. When continuing from a decision, turn-based actions are already processed
  //    in handleAdvanceToNextStep when steps advance
  // 3. Calling it here would cause turn-based actions (like drawing) to happen twice
  let state = initialState;
  const allEvents: GameEvent[] = [];

  while (!isGameOver(state)) {
    const engineAction = nextEngineAction(state);
    if (!engineAction) {
      // No engine action available - need a player decision
      // Check if current step grants priority (rule 500.3)
      if (state.turn.step && !stepGrantsPriority(state.turn.step)) {
        // Step without priority - should advance automatically
        // This shouldn't happen if advancement logic is correct
        break;
      }

      // Determine which player should receive priority
      // Start with active player, but if they've passed, check next player in priority order
      // Based on rule 117.3d: When a player passes, the next player in turn order receives priority
      const nextPlayer: PlayerId | undefined = getNextPlayerWithPriority(state);

      // If all players have passed, nextEngineAction should have returned an advancement action
      // But if we get here, use the next player or fallback to active player
      // This should never be undefined at this point, but TypeScript needs the assertion
      if (nextPlayer === undefined) {
        // This shouldn't happen - if all players passed, nextEngineAction should handle it
        // But if we get here, fallback to active player
        break;
      }

      const playerWithPriority: PlayerId = nextPlayer;

      const availableDecisions = getAvailableDecisions(
        state,
        playerWithPriority,
      );

      const decisionEvent: GameEvent = {
        type: 'PLAYER_DECISION_REQUESTED',
        playerId: playerWithPriority,
        availableDecisions,
      };

      allEvents.push(decisionEvent);
      if (onEvents) {
        onEvents([decisionEvent], state);
      }

      return {
        finalState: state,
        events: allEvents,
        needsPlayerDecision: true,
        playerIdNeedingDecision: playerWithPriority,
      };
    }

    const result = reduce(state, engineAction);
    state = result.state;

    // Note: Turn-based actions are already processed in handleAdvanceToNextStep
    // So we don't need to process them again here

    allEvents.push(...result.events);
    if (result.events.length > 0 && onEvents) {
      onEvents(result.events, state);
    }
  }

  return {
    finalState: state,
    events: allEvents,
    needsPlayerDecision: false,
  };
}
