import { GameLog } from '../game-log/game-log';
import { reduce, GameEvent } from '../state/reducer';
import {
  GameState,
  isGameOver,
  nextEngineAction,
  processTurnBasedActions,
} from '../state/state';
import { PlayerId } from '../primitives/id';
import { getAvailableDecisions } from '../decisions/available-decisions';
import { stepGrantsPriority } from '../turn/turn-structure';

export interface RunGameResult {
  finalState: GameState;
  gameLog: GameLog;
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
  let state = processTurnBasedActions(initialState);
  const gameLog: GameLog = [];
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

      // Request decision from active player (rule 117.3)
      const activePlayerId = state.turn.activePlayerId;
      const availableDecisions = getAvailableDecisions(state, activePlayerId);

      const decisionEvent: GameEvent = {
        type: 'PLAYER_DECISION_REQUESTED',
        playerId: activePlayerId,
        availableDecisions,
      };

      allEvents.push(decisionEvent);
      if (onEvents) {
        onEvents([decisionEvent], state);
      }

      return {
        finalState: state,
        gameLog,
        events: allEvents,
        needsPlayerDecision: true,
        playerIdNeedingDecision: activePlayerId,
      };
    }

    const result = reduce(state, engineAction);
    state = result.state;

    // Process turn-based actions after step/phase changes
    if (engineAction.type === 'ADVANCE_TO_NEXT_STEP') {
      state = processTurnBasedActions(state);
    }

    allEvents.push(...result.events);
    if (result.events.length > 0 && onEvents) {
      onEvents(result.events, state);
    }
  }

  return {
    finalState: state,
    gameLog,
    events: allEvents,
    needsPlayerDecision: false,
  };
}
