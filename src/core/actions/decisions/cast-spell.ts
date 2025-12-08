import { produce } from 'immer';

import type { SpellAbility } from '../../card/card';
import type { PlayerId } from '../../primitives/id';
import type { AvailablePlayerDecision } from '../../state/reducer';
import type { GameState } from '../../state/state';
import { getValidTargets } from '../../targeting/get-valid-targets';

/**
 * Adds CAST_SPELL decisions for valid spell cards in the player's hand.
 * Only adds decisions for spells that have valid targets (if targeting is required).
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

      const spellAbility = definition.abilities.find(
        (a): a is SpellAbility => a.type === 'spell',
      );
      if (spellAbility) {
        // If spell requires targets, check if valid targets exist
        if (spellAbility.targets) {
          const validTargets = getValidTargets(state, spellAbility, playerId);
          // Only add decision if valid targets exist
          if (validTargets.length > 0) {
            draft.push({ type: 'CAST_SPELL', cardId, targets: [] });
          }
        } else {
          // Spell doesn't require targets, always add decision
          draft.push({ type: 'CAST_SPELL', cardId, targets: [] });
        }
      }
    });
  });
}
