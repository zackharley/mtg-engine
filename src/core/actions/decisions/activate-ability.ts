import { produce } from 'immer';

import type { ActivatedAbility } from '../../card/card';
import { isManaAbility } from '../../card/mana-ability';
import type { CardId, PlayerId } from '../../primitives/id';
import type { AvailablePlayerDecision } from '../../state/reducer';
import type { GameState } from '../../state/state';

/**
 * Adds ACTIVATE_ABILITY decisions for valid activated abilities on permanents the player controls.
 * Rule 605.3a: Mana abilities can be activated whenever player has priority, or during mana payment.
 * Rule 117.1b: Non-mana activated abilities can be activated whenever player has priority.
 */
export function addActivateAbilityDecisions(
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
      if (!card) {
        return;
      }

      const definition = state.cardDefinitions[card.definitionId];
      if (!definition) {
        return;
      }

      // Find all activated abilities on this permanent
      definition.abilities.forEach((ability, abilityIndex) => {
        if (ability.type !== 'activated') {
          return;
        }

        const activatedAbility = ability;

        // Check if ability can be activated
        if (!canActivateAbility(state, playerId, cardId, activatedAbility)) {
          return;
        }

        // Add decision for this ability
        draft.push({
          type: 'ACTIVATE_ABILITY',
          cardId,
          abilityIndex,
          targets: [], // TODO: Support target selection
        });
      });
    });
  });
}

/**
 * Checks if an activated ability can be activated by the player.
 * Validates costs, timing restrictions, and other requirements.
 */
function canActivateAbility(
  state: GameState,
  playerId: PlayerId,
  cardId: CardId,
  ability: ActivatedAbility,
): boolean {
  const card = state.cards[cardId];
  if (!card) {
    return false;
  }

  // Check timing restrictions
  if (ability.timing === 'SORCERY_SPEED') {
    // Can only activate at sorcery speed when:
    // - Player has priority
    // - Stack is empty
    // - It's the player's main phase
    if (!isEmptyStack(state)) {
      return false;
    }
    if (state.turn.activePlayerId !== playerId) {
      return false;
    }
    // TODO: Check if it's a main phase
  }

  // Check if costs can be paid
  for (const cost of ability.cost) {
    switch (cost.kind) {
      case 'TAP_SOURCE': {
        if (card.tapped) {
          return false;
        }
        break;
      }
      case 'MANA': {
        // Check if player has enough mana
        const player = state.players[playerId];
        if (!player) {
          return false;
        }
        // TODO: Implement proper mana cost checking
        // For now, allow if player has any mana (simplified)
        const totalMana = Object.values(player.manaPool).reduce(
          (sum, amount) => sum + amount,
          0,
        );
        // Simplified check - just verify player has some mana
        // Proper implementation would check specific mana requirements
        if (totalMana === 0 && cost.manaCost.pips.length > 0) {
          return false;
        }
        break;
      }
      case 'PAY_LIFE': {
        const player = state.players[playerId];
        if (!player || player.life < cost.amount) {
          return false;
        }
        break;
      }
      case 'SACRIFICE_PERMANENT': {
        // TODO: Implement sacrifice cost checking
        return false;
      }
    }
  }

  // Rule 605.3a: Mana abilities can be activated even when stack is not empty
  // For non-mana abilities, we already checked timing restrictions above
  if (!isManaAbility(ability)) {
    // Non-mana abilities follow normal priority rules
    // (already checked via timing restrictions)
  }

  return true;
}

function isEmptyStack(state: GameState): boolean {
  return state.stack.length === 0;
}
