import type { PlayerId } from '../primitives/id';
import { isEmptyOrderedStack } from '../primitives/ordered-stack';
import type { AvailablePlayerDecision } from '../state/reducer';
import type { GameState } from '../state/state';

/**
 * Gets the maximum number of lands a player can play per turn.
 * Default is 1 (rule 305.3), but can be modified by card effects.
 * For now, returns the default limit of 1.
 */
function getLandPlayLimit(_state: GameState, _playerId: PlayerId): number {
  // TODO: Check for effects that modify land play limit
  // Examples: Exploration, Azusa Lost but Seeking, etc.
  return 1;
}

/**
 * Determines what decisions are available to a player given the current game state.
 * This is a simplified version - in a full implementation, this would check:
 * - Priority rules
 * - Turn structure
 * - Mana costs
 * - Targeting restrictions
 * - etc.
 */
export function getAvailableDecisions(
  state: GameState,
  playerId: PlayerId,
): AvailablePlayerDecision[] {
  const decisions: AvailablePlayerDecision[] = [];
  const player = state.players[playerId];

  if (!player) {
    return decisions;
  }

  // Check if player can draw a card (has cards in library)
  if (!isEmptyOrderedStack(player.library)) {
    decisions.push({ type: 'DRAW_CARD' });
  }

  // Check cards in hand
  for (const cardId of player.hand) {
    const card = state.cards[cardId];
    const definition = state.cardDefinitions[card.definitionId];

    if (!card || !definition) {
      continue;
    }

    // Check if it's a land that can be played
    // Rule 305.3: A player can normally play only one land card per turn
    if (definition.type === 'land') {
      const landPlayLimit = getLandPlayLimit(state, playerId);
      const landsPlayedThisTurn =
        state.turn.activePlayerId === playerId
          ? state.turn.landPlayedThisTurn
          : 0;

      if (landsPlayedThisTurn < landPlayLimit) {
        decisions.push({ type: 'PLAY_LAND', cardId });
      }
    }

    // Check if it can be cast as a spell
    const spellAbility = definition.abilities.find((a) => a.type === 'spell');
    if (spellAbility) {
      decisions.push({ type: 'CAST_SPELL', cardId, targets: [] });
    }
  }

  // Check permanents on battlefield that can be tapped for mana
  for (const cardId of player.battlefield) {
    const card = state.cards[cardId];
    if (!card || card.tapped) {
      continue;
    }

    const definition = state.cardDefinitions[card.definitionId];
    if (!definition) {
      continue;
    }

    // Check if it has a mana ability (simplified - just check if it's a basic land)
    if (
      definition.type === 'land' &&
      definition.name.toLowerCase() === 'mountain'
    ) {
      decisions.push({ type: 'TAP_PERMANENT_FOR_MANA', cardId });
    }
  }

  // Always allow passing
  decisions.push({ type: 'PASS' });

  // Always allow passing priority explicitly
  decisions.push({ type: 'PASS_PRIORITY' });

  // Allow ending the game (for testing/debugging)
  decisions.push({ type: 'END_GAME' });

  return decisions;
}
