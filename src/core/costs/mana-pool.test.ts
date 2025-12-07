import { createTestContext } from '@/__tests__/test-utils';

import { makePlayerId } from '../primitives/id';
import { createOrderedStack } from '../primitives/ordered-stack';
import { addMana } from './mana-pool';

describe('mana-pool', () => {
  describe('addMana', () => {
    it('adds mana to correct color', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      const result = addMana(ctx.state, playerId, 'R', 1);

      expect(result.players[playerId].manaPool.R).toBe(1);
    });

    it('adds multiple mana', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      const result = addMana(ctx.state, playerId, 'G', 3);

      expect(result.players[playerId].manaPool.G).toBe(3);
    });

    it('adds to existing mana', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {
            [playerId]: {
              name: 'Test Player',
              life: 20,
              manaPool: { W: 0, U: 0, B: 0, R: 2, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
        },
        playerId,
      });

      const result = addMana(ctx.state, playerId, 'R', 1);

      expect(result.players[playerId].manaPool.R).toBe(3);
    });

    it('defaults to amount 1', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      const result = addMana(ctx.state, playerId, 'U');

      expect(result.players[playerId].manaPool.U).toBe(1);
    });

    it('works for all mana colors', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });
      let state = ctx.state;

      state = addMana(state, playerId, 'W', 1);
      state = addMana(state, playerId, 'U', 2);
      state = addMana(state, playerId, 'B', 3);
      state = addMana(state, playerId, 'R', 4);
      state = addMana(state, playerId, 'G', 5);

      expect(state.players[playerId].manaPool).toEqual({
        W: 1,
        U: 2,
        B: 3,
        R: 4,
        G: 5,
      });
    });

    it('returns new state object (immutability)', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      const result = addMana(ctx.state, playerId, 'R', 1);

      expect(result).not.toBe(ctx.state);
      expect(result.players).not.toBe(ctx.state.players);
    });

    it('throws error when player not found', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {},
        },
      });

      expect(() => {
        addMana(ctx.state, playerId, 'R', 1);
      }).toThrow(`Player ${playerId} not found in game state`);
    });
  });
});
