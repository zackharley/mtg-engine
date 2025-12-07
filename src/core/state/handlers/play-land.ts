import { produce } from 'immer';

import { moveCard } from '../../card/move-card';
import { resetPriorityPasses } from '../../priority/priortity';
import type { GameAction, ReduceContext } from '../reducer';

/**
 * Gets the maximum number of lands a player can play per turn.
 * Default is 1 (rule 305.3), but can be modified by card effects.
 * For now, returns the default limit of 1.
 */
function getLandPlayLimit(
  _state: ReduceContext['state'],
  _playerId: string,
): number {
  // TODO: Check for effects that modify land play limit
  // Examples: Exploration, Azusa Lost but Seeking, etc.
  return 1;
}

export default function handlePlayLand(
  ctx: ReduceContext,
  action: Extract<GameAction, { type: 'PLAY_LAND' }>,
): void {
  const { playerId, cardId } = action;
  const state = ctx.state;
  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found');
  }
  if (!player.hand.includes(cardId)) {
    throw new Error('Land is not in hand');
  }

  // Check if player has reached their land play limit for this turn
  // Rule 305.3: A player can normally play only one land card per turn
  const landPlayLimit = getLandPlayLimit(state, playerId);
  if (
    state.turn.activePlayerId === playerId &&
    state.turn.landPlayedThisTurn >= landPlayLimit
  ) {
    throw new Error(
      `Player has already played ${state.turn.landPlayedThisTurn} land(s) this turn (limit: ${landPlayLimit})`,
    );
  }

  const nextState = moveCard(state, {
    cardId,
    from: 'hand',
    to: 'battlefield',
  });
  ctx.state = produce(nextState, (draft) => {
    draft.cards[cardId].tapped = false;

    // Increment land play count if this is the active player's turn
    if (draft.turn.activePlayerId === playerId) {
      draft.turn.landPlayedThisTurn += 1;
    }
  });

  // Reset priority passes when a player takes an action (rule 117.3c)
  ctx.state = resetPriorityPasses(ctx.state);

  ctx.emit({
    type: 'CARD_MOVED',
    cardId,
    from: 'hand',
    to: 'battlefield',
  });
}
