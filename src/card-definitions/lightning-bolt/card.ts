import { produce } from 'immer';

import type { AbilityEffect } from '../../core/card/card';
import { defineCard } from '../../core/card/card';
import { parseManaCost } from '../../core/costs/mana-costs';

const dealThreeDamage: AbilityEffect = (
  ctx,
  { targets, sourceId, controllerId },
) => {
  const targetId = targets[0];
  if (!targetId) {
    throw new Error('Lightning Bolt requires a target.');
  }

  if (targetId in ctx.state.players) {
    const playerKey = targetId as keyof typeof ctx.state.players;
    ctx.state = produce(ctx.state, (draft) => {
      draft.players[playerKey].life -= 3;
    });

    ctx.emit({
      type: 'DIRECT_DAMAGE_APPLIED',
      sourceCardId: sourceId,
      controllerId,
      targetId: targetId,
      amount: 3,
    });
    return;
  }

  throw new Error('Lightning Bolt target type not supported yet.');
};

export default defineCard({
  scryfallId: 'ddaa110c-ee6e-4df5-a6c8-3fdf4b89293f',
  type: 'instant',
  name: 'Lightning Bolt',
  manaCost: parseManaCost('{R}'),
  abilities: [
    {
      type: 'spell',
      text: 'Lightning Bolt deals 3 damage to any target.',
      effect: dealThreeDamage,
      targets: () => [
        {
          description: 'Any target',
          minTargets: 1,
          maxTargets: 1,
          validate: () => true,
        },
      ],
    },
  ],
});
