import { drawCard } from '../../deck/deck';
import { resetPriorityPasses } from '../../priority/priortity';
import type { GameAction, ReduceContext } from '../reducer';

export default function handleDrawCard(
  ctx: ReduceContext,
  action: Extract<GameAction, { type: 'DRAW_CARD' }>,
): void {
  ctx.state = drawCard(ctx.state, action.playerId);
  // Reset priority passes when a player takes an action (rule 117.3c)
  ctx.state = resetPriorityPasses(ctx.state);
}
