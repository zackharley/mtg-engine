import { castDraft, produce } from 'immer';

import type { SpellAbility } from '../../card/card';
import { payManaCost } from '../../costs/pay-mana';
import { makeStackObjectId } from '../../primitives/id';
import { pushOrderedStack } from '../../primitives/ordered-stack';
import { resetPriorityPasses } from '../../priority/priortity';
import type { GameAction, ReduceContext } from '../reducer';

export function handleCastSpell(
  ctx: ReduceContext,
  action: Extract<GameAction, { type: 'CAST_SPELL' }>,
) {
  const { playerId, cardId, targets = [] } = action;
  const state = ctx.state;
  const player = state.players[playerId];

  if (!player.hand.includes(cardId)) {
    throw new Error('Card is not in hand');
  }

  const card = state.cards[cardId];
  if (!card) {
    throw new Error('Card not found in game state');
  }
  const cardDefinition = state.cardDefinitions[card.definitionId];
  if (!cardDefinition) {
    throw new Error('Card definition missing for card');
  }

  const spellAbility = cardDefinition.abilities.find(
    (ability): ability is SpellAbility => ability.type === 'spell',
  );
  if (!spellAbility) {
    throw new Error('Card cannot be cast as a spell');
  }

  // Pay mana cost
  ctx.state = payManaCost(state, playerId, cardDefinition.manaCost);

  // Reset priority passes when a player takes an action (rule 117.3c)
  ctx.state = resetPriorityPasses(ctx.state);

  const stackObjectId = makeStackObjectId();
  const stackObject = {
    id: stackObjectId,
    controllerId: playerId,
    type: 'SPELL' as const,
    sourceCardId: cardId,
    targets: targets,
    effect: (effectCtx: ReduceContext) => {
      spellAbility.effect(effectCtx, {
        targets,
        sourceId: cardId,
        controllerId: playerId,
      });
    },
  };

  ctx.state = produce(ctx.state, (draft) => {
    const playerDraft = draft.players[playerId];
    playerDraft.hand = playerDraft.hand.filter((id) => id !== cardId);
    draft.stack = castDraft(pushOrderedStack(draft.stack, stackObject));
  });

  ctx.emit({
    type: 'SPELL_CAST',
    playerId,
    cardId,
    stackObjectId,
    targets,
  });
}
