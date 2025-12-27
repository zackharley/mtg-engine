import { castDraft, produce } from 'immer';

import type { ActivatedAbility } from '../../card/card';
import { isManaAbility } from '../../card/mana-ability';
import type { CardId, PlayerId, TargetId } from '../../primitives/id';
import { makeStackObjectId } from '../../primitives/id';
import { pushOrderedStack } from '../../primitives/ordered-stack';
import { resetPriorityPasses } from '../../priority/priortity';
import type { StackObject } from '../../stack/stack';
import type { GameAction, ReduceContext } from '../reducer';
import {
  handleActivateManaAbility,
  payActivationCosts,
  validateAbilityActivation,
} from './activate-mana-ability';

/**
 * Handles activation of an activated ability (rule 602).
 * Routes to mana ability handler if applicable, otherwise puts ability on stack.
 */
export function handleActivateAbility(
  ctx: ReduceContext,
  action: Extract<GameAction, { type: 'ACTIVATE_ABILITY' }>,
): void {
  const { playerId, cardId, abilityIndex, targets = [] } = action;
  const state = ctx.state;

  const { ability } = validateAbilityActivation(
    state,
    playerId,
    cardId,
    abilityIndex,
  );

  const activatedAbility = ability as ActivatedAbility;

  // Check if this is a mana ability - if so, handle it specially
  if (isManaAbility(activatedAbility)) {
    handleActivateManaAbility(ctx, action);
    return;
  }

  // For non-mana abilities, put on stack (rule 602.2a)
  // Pay activation costs first
  ctx.state = payActivationCosts(
    state,
    playerId,
    activatedAbility.cost,
    cardId,
  );

  // Reset priority passes when a player takes an action (rule 117.3c)
  ctx.state = resetPriorityPasses(ctx.state);

  // Create stack object for the ability
  const stackObject = createAbilityStackObject(
    cardId,
    playerId,
    targets,
    activatedAbility,
  );

  ctx.state = produce(ctx.state, (draft) => {
    draft.stack = castDraft(pushOrderedStack(draft.stack, stackObject));
  });

  ctx.emit({
    type: 'ABILITY_ACTIVATED',
    playerId,
    cardId,
    abilityIndex,
    stackObjectId: stackObject.id,
    targets,
  });
}

function createAbilityStackObject(
  cardId: CardId,
  playerId: PlayerId,
  targets: TargetId[],
  ability: ActivatedAbility,
): StackObject {
  const stackObjectId = makeStackObjectId();
  return {
    id: stackObjectId,
    controllerId: playerId,
    type: 'ABILITY' as const,
    sourceCardId: cardId,
    targets: targets,
    effect: (effectCtx: ReduceContext) => {
      ability.effect(effectCtx, {
        targets,
        sourceId: cardId,
        controllerId: playerId,
      });
    },
  };
}
