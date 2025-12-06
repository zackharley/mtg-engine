import { GameLog } from '../game-log/game-log';
import { GameState, isGameOver } from '../state/state';

function runGame(initialState: GameState) {
  let state = initialState;
  const gameLog: GameLog = [];

  while (!isGameOver(state)) {}

  return { finalState: state, gameLog: [] };
}
