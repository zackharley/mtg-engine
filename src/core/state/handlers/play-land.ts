import { moveCard } from '../../card/move-card';
import { GameAction, ReduceContext } from '../reducer';

export default function handlePlayLand(
  ctx: ReduceContext,
  action: Extract<GameAction, { type: 'PLAY_LAND' }>,
): void {
  const { playerId, cardId } = action;
  const player = ctx.state.players[playerId];
  if (!player) {
    throw new Error('Player not found');
  }
  if (!player.hand.includes(cardId)) {
    throw new Error('Land is not in hand');
  }

  const nextState = moveCard(ctx.state, cardId, 'hand', 'battlefield');
  ctx.state = {
    ...nextState,
    cards: {
      ...nextState.cards,
      [cardId]: { ...nextState.cards[cardId], tapped: false },
    },
  };

  ctx.emit({
    type: 'CARD_MOVED',
    cardId,
    from: 'hand',
    to: 'battlefield',
  });
}
