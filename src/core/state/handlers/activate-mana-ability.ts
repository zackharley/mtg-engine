import { produce } from 'immer';

import type { ActivatedAbility, CardDefinition } from '../../card/card';
import { isManaAbility } from '../../card/mana-ability';
import { payManaCost } from '../../costs/pay-mana';
import type { CardId, PlayerId } from '../../primitives/id';
import { resetPriorityPasses } from '../../priority/priortity';
import type { GameAction, ReduceContext } from '../reducer';
import type { GameState } from '../state';

/**
 * Handles activation of a mana ability (rule 605.3).
 * Mana abilities resolve immediately without using the stack (rule 605.3b).
 */
export function handleActivateManaAbility(
  ctx: ReduceContext,
  action: Extract<GameAction, { type: 'ACTIVATE_ABILITY' }>,
): void {
  const { playerId, cardId, abilityIndex } = action;
  const state = ctx.state;

  const { ability } = validateAbilityActivation(
    state,
    playerId,
    cardId,
    abilityIndex,
  );

  if (!isManaAbility(ability)) {
    throw new Error('Ability is not a mana ability');
  }

  const activatedAbility = ability as ActivatedAbility;

  ctx.state = payActivationCosts(
    state,
    playerId,
    activatedAbility.cost,
    cardId,
  );

  // Rule 605.3b: Mana abilities resolve immediately, don't go on stack
  // Execute the effect immediately
  const effectArgs = {
    sourceId: cardId,
    controllerId: playerId,
    targets: [], // Mana abilities don't have targets (rule 605.1a)
  };

  activatedAbility.effect(ctx, effectArgs);

  // Reset priority passes when a player takes an action (rule 117.3c)
  ctx.state = resetPriorityPasses(ctx.state);

  ctx.emit({
    type: 'MANA_ABILITY_ACTIVATED',
    playerId,
    cardId,
    abilityIndex,
  });
}

/**
 * Validates that an ability can be activated.
 * Shared validation logic for both mana and non-mana abilities.
 */
export function validateAbilityActivation(
  state: GameState,
  playerId: PlayerId,
  cardId: CardId,
  abilityIndex: number,
): {
  ability: CardDefinition['abilities'][number];
} {
  const card = state.cards[cardId];
  if (!card) {
    throw new Error('Card not found');
  }

  if (card.controllerId !== playerId) {
    throw new Error(
      'Cannot activate ability of a permanent you do not control',
    );
  }

  // Ensure the card is on the battlefield
  const player = state.players[playerId];
  if (!player?.battlefield.includes(cardId)) {
    throw new Error('Permanent is not on the battlefield');
  }

  const cardDefinition = state.cardDefinitions[card.definitionId];
  if (!cardDefinition) {
    throw new Error('Card definition not found');
  }

  const ability = cardDefinition.abilities[abilityIndex];
  if (!ability) {
    throw new Error(`Ability at index ${abilityIndex} not found`);
  }

  if (ability.type !== 'activated') {
    throw new Error('Only activated abilities can be activated');
  }

  return { ability };
}

/**
 * Pays the activation costs for an ability.
 * Shared cost payment logic for both mana and non-mana abilities.
 */
export function payActivationCosts(
  state: GameState,
  playerId: PlayerId,
  costs: ActivatedAbility['cost'],
  cardId: CardId,
): GameState {
  return costs.reduce((currentState, cost) => {
    switch (cost.kind) {
      case 'MANA': {
        return payManaCost(currentState, playerId, cost.manaCost);
      }
      case 'TAP_SOURCE': {
        const card = currentState.cards[cardId];
        if (!card) {
          throw new Error('Card not found');
        }
        if (card.tapped) {
          throw new Error('Permanent is already tapped');
        }
        return produce(currentState, (draft) => {
          draft.cards[cardId].tapped = true;
        });
      }
      case 'PAY_LIFE': {
        const player = currentState.players[playerId];
        if (!player) {
          throw new Error('Player not found');
        }
        if (player.life < cost.amount) {
          throw new Error('Insufficient life to pay cost');
        }
        return produce(currentState, (draft) => {
          draft.players[playerId].life -= cost.amount;
        });
      }
      case 'SACRIFICE_PERMANENT': {
        // TODO: Implement sacrifice cost
        throw new Error('Sacrifice cost not yet implemented');
      }
    }
  }, state);
}
