import { produce } from 'immer';

import { defineCard } from '../../core/card/card';
import type { ReduceContext } from '../../core/state/reducer';

export const mountain = defineCard({
  scryfallId: 'basic-land-mountain',
  type: 'land',
  name: 'Mountain',
  manaCost: { pips: [], raw: '' },
  abilities: [
    {
      type: 'activated',
      text: 'Tap: Add {R}.',
      cost: [{ kind: 'TAP_SOURCE' }],
      effect: (ctx: ReduceContext) => {
        ctx.state = produce(ctx.state, (_draft) => {
          // TODO: Determine who the player is who's tapping the land
          // _draft.players[].manaPool.R += 1;
        });
      },
    },
  ],
});

export default mountain;
