import { produce } from 'immer';
import { GameAction, ReduceContext } from '../reducer';
import { addMana } from '../../costs/mana-pool';

export default function handleTapPermanentForMana(
  ctx: ReduceContext,
  action: Extract<GameAction, { type: 'TAP_PERMANENT_FOR_MANA' }>,
): void {
  const { playerId, cardId } = action;
  const card = ctx.state.cards[cardId];
  if (!card) {
    throw new Error('Card not found');
  }
  if (card.controllerId !== playerId) {
    throw new Error('Cannot tap a permanent you do not control');
  }
  if (card.tapped) {
    throw new Error('Permanent is already tapped');
  }

  // Ensure the card is on the battlefield
  const player = ctx.state.players[playerId];
  if (!player?.battlefield.includes(cardId)) {
    throw new Error('Permanent is not on the battlefield');
  }

  const tappedState = produce(ctx.state, (draft) => {
    draft.cards[cardId].tapped = true;
  });

  const withMana = addMana(tappedState, playerId, 'R', 1);

  ctx.state = withMana;
  ctx.emit({ type: 'MANA_ADDED', playerId, color: 'R', amount: 1 });
}
