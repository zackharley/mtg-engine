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

/**
 * Gets the next player in priority order who hasn't passed priority.
 * Based on rule 117.3d: When a player passes, the next player in turn order receives priority.
 * Priority order starts with the active player and proceeds clockwise.
 * Returns undefined if all players have passed priority.
 *
 * @throws Error if activePlayerId is not found in state.players - this indicates corrupted game state
 */
export function getNextPlayerWithPriority(
  state: GameState,
): PlayerId | undefined {
  const playerIds = Object.keys(state.players) as PlayerId[];
  if (playerIds.length === 0) {
    return undefined;
  }

  const activePlayerId = state.turn.activePlayerId;

  // Verify the active player exists - this should never fail in valid game state
  if (!state.players[activePlayerId]) {
    throw new Error(
      `Active player ${activePlayerId} not found in game state. This indicates corrupted game state.`,
    );
  }

  const currentIndex = playerIds.indexOf(activePlayerId);

  // First check if the active player hasn't passed (they should get priority first)
  if (!state.playersWhoPassedPriority.has(activePlayerId)) {
    return activePlayerId;
  }

  // Active player has passed, find the next player in turn order who hasn't passed
  for (let i = 1; i < playerIds.length; i++) {
    const nextIndex = (currentIndex + i) % playerIds.length;
    const nextPlayerId = playerIds[nextIndex];
    if (!state.playersWhoPassedPriority.has(nextPlayerId)) {
      return nextPlayerId;
    }
  }

  // All players have passed
  return;
}
