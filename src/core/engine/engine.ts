import { GameLog } from '../game-log/game-log';
import { reduce, GameEvent } from '../state/reducer';
import { GameState, isGameOver, nextEngineAction } from '../state/state';

export interface RunGameResult {
  finalState: GameState;
  gameLog: GameLog;
  events: GameEvent[];
}

export function runGame(initialState: GameState): RunGameResult {
  let state = initialState;
  const gameLog: GameLog = [];
  const allEvents: GameEvent[] = [];

  while (!isGameOver(state)) {
    const engineAction = nextEngineAction(state);
    if (!engineAction) {
      break;
    }

    const result = reduce(state, engineAction);
    state = result.state;
    allEvents.push(...result.events);
  }

  return { finalState: state, gameLog, events: allEvents };
}
