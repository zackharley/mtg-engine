import { GameState } from '../state/state';
import { PlayerId } from '../primitives/id';

/**
 * Checks if all players have passed priority.
 * Based on rule 117.4: If all players pass in succession, the phase/step ends or stack resolves.
 */
export function allPlayersHavePassedPriority(state: GameState): boolean {
  const playerIds = Object.keys(state.players) as PlayerId[];
  if (playerIds.length === 0) {
    return false;
  }

  // All players must have passed priority
  return playerIds.every((playerId) =>
    state.playersWhoPassedPriority.has(playerId),
  );
}

/**
 * Marks a player as having passed priority.
 */
export function markPlayerPassedPriority(
  state: GameState,
  playerId: PlayerId,
): GameState {
  return {
    ...state,
    playersWhoPassedPriority: new Set(state.playersWhoPassedPriority).add(
      playerId,
    ),
  };
}

/**
 * Resets priority passes. Called when a player takes an action.
 * Based on rule 117.3c: If a player takes an action, they receive priority afterward.
 */
export function resetPriorityPasses(state: GameState): GameState {
  return {
    ...state,
    playersWhoPassedPriority: new Set(),
  };
}
