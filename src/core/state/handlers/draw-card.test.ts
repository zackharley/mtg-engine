import { createTestContext } from '@/__tests__/test-utils';

import { defineCard } from '../../card/card';
import { parseManaCost } from '../../costs/mana-costs';
import { registerCardForPlayer } from '../../deck/deck';
import { makePlayerId } from '../../primitives/id';
import handleDrawCard from './draw-card';

describe('draw-card', () => {
  describe('handleDrawCard', () => {
    it('draws card from library to hand', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{1}'),
        abilities: [],
      });

      const ctx = createTestContext({ playerId });
      ctx.state = registerCardForPlayer(ctx.state, playerId, testCard, 1);

      handleDrawCard(ctx, { type: 'DRAW_CARD', playerId });

      expect(ctx.state.players[playerId].hand).toHaveLength(1);
      expect(ctx.state.players[playerId].library).toHaveLength(0);
    });

    it('resets priority passes (rule 117.3c)', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{1}'),
        abilities: [],
      });

      const ctx = createTestContext({ playerId });
      ctx.state = {
        ...registerCardForPlayer(ctx.state, playerId, testCard, 1),
        playersWhoPassedPriority: new Set([playerId]),
      };

      handleDrawCard(ctx, { type: 'DRAW_CARD', playerId });

      expect(ctx.state.playersWhoPassedPriority.size).toBe(0);
    });

    it('throws error when library is empty', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      expect(() => {
        handleDrawCard(ctx, { type: 'DRAW_CARD', playerId });
      }).toThrow('has no cards in library to draw');
    });
  });
});
