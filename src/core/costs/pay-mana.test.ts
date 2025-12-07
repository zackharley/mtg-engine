import { createTestContext } from '@/__tests__/test-utils';

import { makePlayerId } from '../primitives/id';
import { createOrderedStack } from '../primitives/ordered-stack';
import { parseManaCost } from './mana-costs';
import { payManaCost } from './pay-mana';

describe('pay-mana', () => {
  describe('payManaCost', () => {
    it('pays colored mana', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {
            [playerId]: {
              name: 'Test Player',
              life: 20,
              manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
        },
      });
      const cost = parseManaCost('{R}');

      const result = payManaCost(ctx.state, playerId, cost);

      expect(result.players[playerId].manaPool.R).toBe(0);
    });

    it('pays generic mana from colored sources', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {
            [playerId]: {
              name: 'Test Player',
              life: 20,
              manaPool: { W: 0, U: 0, B: 0, R: 3, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
        },
      });
      const cost = parseManaCost('{2}{R}');

      const result = payManaCost(ctx.state, playerId, cost);

      expect(result.players[playerId].manaPool.R).toBe(0);
    });

    it('pays multiple colored mana', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {
            [playerId]: {
              name: 'Test Player',
              life: 20,
              manaPool: { W: 1, U: 1, B: 1, R: 1, G: 1 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
        },
      });
      const cost = parseManaCost('{W}{U}{B}{R}{G}');

      const result = payManaCost(ctx.state, playerId, cost);

      expect(result.players[playerId].manaPool).toEqual({
        W: 0,
        U: 0,
        B: 0,
        R: 0,
        G: 0,
      });
    });

    it('throws error when insufficient colored mana', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {
            [playerId]: {
              name: 'Test Player',
              life: 20,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
        },
      });
      const cost = parseManaCost('{R}');

      expect(() => {
        payManaCost(ctx.state, playerId, cost);
      }).toThrow('Insufficient mana');
    });

    it('throws error when insufficient generic mana', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {
            [playerId]: {
              name: 'Test Player',
              life: 20,
              manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
        },
      });
      const cost = parseManaCost('{5}');

      expect(() => {
        payManaCost(ctx.state, playerId, cost);
      }).toThrow('Insufficient generic mana');
    });

    it('pays COLORLESS pips as generic', () => {
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
      });
      const cost = parseManaCost('{C}{C}');

      const result = payManaCost(ctx.state, playerId, cost);

      expect(result.players[playerId].manaPool.R).toBe(0);
    });

    it('returns new state object (immutability)', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {
            [playerId]: {
              name: 'Test Player',
              life: 20,
              manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
        },
      });
      const cost = parseManaCost('{R}');

      const result = payManaCost(ctx.state, playerId, cost);

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
      const cost = parseManaCost('{R}');

      expect(() => {
        payManaCost(ctx.state, playerId, cost);
      }).toThrow(`Player ${playerId} not found in game state`);
    });
  });
});
