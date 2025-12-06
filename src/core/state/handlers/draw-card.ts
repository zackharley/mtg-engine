import { GameAction, ReduceContext } from '../reducer';
import { drawCard } from '../../deck/deck';

export default function handleDrawCard(
  ctx: ReduceContext,
  action: Extract<GameAction, { type: 'DRAW_CARD' }>,
): void {
  ctx.state = drawCard(ctx.state, action.playerId);
}
