import { produce } from 'immer';

import type { PlayerId } from '../../primitives/id';
import type { AvailablePlayerDecision } from '../../state/reducer';
import type { GameState } from '../../state/state';

/**
 * Adds TAP_PERMANENT_FOR_MANA decisions for valid permanents on the battlefield.
 */
export function addTapPermanentForManaDecisions(
  state: GameState,
  playerId: PlayerId,
  decisions: AvailablePlayerDecision[],
): AvailablePlayerDecision[] {
  const player = state.players[playerId];
  if (!player) {
    return decisions;
  }

  return produce(decisions, (draft) => {
    player.battlefield.forEach((cardId) => {
      const card = state.cards[cardId];
      if (!card || card.tapped) {
        return;
      }

      const definition = state.cardDefinitions[card.definitionId];
      if (!definition) {
        return;
      }

      // TODO: Check if the card has a mana ability
      // Currently simplified - just check if it's a basic land
      const basicLandNames = [
        'plains',
        'island',
        'swamp',
        'mountain',
        'forest',
      ];
      if (
        definition.type === 'land' &&
        basicLandNames.includes(definition.name.toLowerCase())
      ) {
        draft.push({ type: 'TAP_PERMANENT_FOR_MANA', cardId });
      }
    });
  });
}
