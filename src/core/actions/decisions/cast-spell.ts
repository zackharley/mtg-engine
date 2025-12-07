import { produce } from 'immer';

import type { PlayerId } from '../../primitives/id';
import type { AvailablePlayerDecision } from '../../state/reducer';
import type { GameState } from '../../state/state';

/**
 * Adds CAST_SPELL decisions for valid spell cards in the player's hand.
 */
export function addCastSpellDecisions(
  state: GameState,
  playerId: PlayerId,
  decisions: AvailablePlayerDecision[],
): AvailablePlayerDecision[] {
  const player = state.players[playerId];
  if (!player) {
    return decisions;
  }

  return produce(decisions, (draft) => {
    player.hand.forEach((cardId) => {
      const card = state.cards[cardId];
      const definition = state.cardDefinitions[card?.definitionId];

      if (!card || !definition) {
        return;
      }

      const spellAbility = definition.abilities.find((a) => a.type === 'spell');
      if (spellAbility) {
        // TODO: Add targets
        draft.push({ type: 'CAST_SPELL', cardId, targets: [] });
      }
    });
  });
}
