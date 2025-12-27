import { produce } from 'immer';

import { defineCard } from '../core/card/card';
import type { ManaColor } from '../core/costs/mana-costs';
import type { ReduceContext } from '../core/state/reducer';

/**
 * Factory function to create basic land card definitions.
 * Creates a land that taps for one mana of the specified color.
 *
 * @param name - The name of the basic land (e.g., 'Mountain', 'Plains')
 * @param manaColor - The color of mana this land produces (W, U, B, R, or G)
 * @returns A CardDefinition for the basic land
 */
export function defineBasicLand(
  name: string,
  manaColor: ManaColor,
): ReturnType<typeof defineCard> {
  const manaSymbol = `{${manaColor}}`;
  const scryfallId = `basic-land-${name.toLowerCase()}`;

  return defineCard({
    scryfallId,
    type: 'land',
    name,
    manaCost: { pips: [], raw: '' },
    abilities: [
      {
        type: 'activated',
        text: `Tap: Add ${manaSymbol}.`,
        cost: [{ kind: 'TAP_SOURCE' }],
        effect: (ctx: ReduceContext) => {
          // TODO: Determine who the player is who's tapping the land
          // The handler currently detects mana color from card name
          // This effect will be properly implemented when mana ability execution is added
          ctx.state = produce(ctx.state, (_draft) => {
            // Placeholder - actual mana addition happens in handler
          });
        },
      },
    ],
  });
}
