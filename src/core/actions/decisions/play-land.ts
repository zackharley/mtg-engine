import { produce } from 'immer';

import type { PlayerId } from '../../primitives/id';
import type { AvailablePlayerDecision } from '../../state/reducer';
import type { GameState } from '../../state/state';

const DEFAULT_LAND_PLAY_LIMIT = 1;

/**
 * Gets the maximum number of lands a player can play per turn.
 * Default is 1 (rule 305.3), but can be modified by card effects.
 * For now, returns the default limit of 1.
 */
function getLandPlayLimit(_state: GameState, _playerId: PlayerId): number {
  // TODO: Check for effects that modify land play limit
  // Examples: Exploration, Azusa Lost but Seeking, etc.
  return DEFAULT_LAND_PLAY_LIMIT;
}

/**
 * Adds PLAY_LAND decisions for valid land cards in the player's hand.
 * Rule 305.3: A player can normally play only one land card per turn.
 * Only the active player can play lands during their turn.
 */
export function addPlayLandDecisions(
  state: GameState,
  playerId: PlayerId,
  decisions: AvailablePlayerDecision[],
): AvailablePlayerDecision[] {
  const player = state.players[playerId];
  if (!player) {
    return decisions;
  }

  if (state.turn.activePlayerId !== playerId) {
    return decisions;
  }

  const landPlayLimit = getLandPlayLimit(state, playerId);
  const landsPlayedThisTurn = state.turn.landPlayedThisTurn;

  if (landsPlayedThisTurn >= landPlayLimit) {
    return decisions;
  }

  return produce(decisions, (draft) => {
    player.hand.forEach((cardId) => {
      const card = state.cards[cardId];
      const definition = state.cardDefinitions[card?.definitionId];

      if (!card || !definition) {
        return;
      }

      if (definition.type === 'land') {
        draft.push({ type: 'PLAY_LAND', cardId });
      }
    });
  });
}
