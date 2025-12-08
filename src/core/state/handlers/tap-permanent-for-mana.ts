import { produce } from 'immer';

import type { ManaColor } from '../../costs/mana-costs';
import { addMana } from '../../costs/mana-pool';
import { resetPriorityPasses } from '../../priority/priortity';
import type { GameAction, ReduceContext } from '../reducer';

/**
 * Maps basic land names to their mana colors.
 * This is a temporary solution until proper mana ability execution is implemented.
 */
function getManaColorFromBasicLandName(name: string): ManaColor | null {
  const normalizedName = name.toLowerCase();
  const basicLandMap: Record<string, ManaColor> = {
    plains: 'W',
    island: 'U',
    swamp: 'B',
    mountain: 'R',
    forest: 'G',
  };
  return basicLandMap[normalizedName] ?? null;
}

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

  // Determine mana color from card definition
  const definition = ctx.state.cardDefinitions[card.definitionId];
  if (!definition) {
    throw new Error('Card definition not found');
  }

  const manaColor = getManaColorFromBasicLandName(definition.name);
  if (!manaColor) {
    throw new Error(
      `Cannot determine mana color for card: ${definition.name}. Only basic lands are currently supported.`,
    );
  }

  const tappedState = produce(ctx.state, (draft) => {
    draft.cards[cardId].tapped = true;
  });

  const withMana = addMana(tappedState, playerId, manaColor, 1);

  ctx.state = withMana;

  // Reset priority passes when a player takes an action (rule 117.3c)
  ctx.state = resetPriorityPasses(ctx.state);

  ctx.emit({ type: 'MANA_ADDED', playerId, color: manaColor, amount: 1 });
}
