import { castDraft,produce } from 'immer';

import { moveCard } from '../../card/move-card';
import {
  peekOrderedStack,
  popOrderedStack,
} from '../../primitives/ordered-stack';
import type { GameAction, ReduceContext } from '../reducer';

export default function handleResolveTopOfStack(
  ctx: ReduceContext,
  _action: Extract<GameAction, { type: 'RESOLVE_TOP_OF_STACK' }>,
): void {
  const state = ctx.state;
  const stackObject = peekOrderedStack(state.stack);
  if (!stackObject) {
    throw new Error('Stack is empty');
  }
  stackObject.effect(ctx);

  // Pop the resolved object from the stack
  const [newStack] = popOrderedStack(state.stack);
  const controllerId = stackObject.controllerId;
  const sourceCardId = stackObject.sourceCardId;

  ctx.state = produce(ctx.state, (draft) => {
    draft.stack = castDraft(newStack);
  });

  if (sourceCardId) {
    // Put instants/sorceries into graveyard for now
    ctx.state = moveCard(ctx.state, sourceCardId, 'stack', 'graveyard');

    ctx.emit({
      type: 'SPELL_RESOLVED',
      playerId: controllerId,
      cardId: sourceCardId,
    });

    ctx.emit({
      type: 'CARD_MOVED',
      cardId: sourceCardId,
      from: 'stack',
      to: 'graveyard',
    });
  }

  // ctx.emit({
  //   type: 'STACK_OBJECT_RESOLVED',
  //   stackObjectId: stackObject.id,
  // });
}
