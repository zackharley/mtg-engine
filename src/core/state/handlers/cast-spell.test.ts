import {
  createContextWithCardInHand,
  createTestContext,
} from '@/__tests__/test-utils';
import lightningBolt from '@/card-definitions/lightning-bolt/card';

import { defineCard } from '../../card/card';
import { parseManaCost } from '../../costs/mana-costs';
import { makeCardId, makePlayerId, type TargetId } from '../../primitives/id';
import { handleCastSpell } from './cast-spell';

describe('cast-spell', () => {
  describe('handleCastSpell', () => {
    it('pays mana cost', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [
          {
            type: 'spell',
            text: 'Deal 3 damage',
            effect: jest.fn(),
            targets: jest.fn().mockReturnValue([]),
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInHand(playerId, testCard, {
        manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
      });

      handleCastSpell(ctx, {
        type: 'CAST_SPELL',
        playerId,
        cardId,
        targets: [],
      });

      expect(ctx.state.players[playerId].manaPool.R).toBe(0);
    });

    it('removes card from hand', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [
          {
            type: 'spell',
            text: 'Deal 3 damage',
            effect: jest.fn(),
            targets: jest.fn().mockReturnValue([]),
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInHand(playerId, testCard, {
        manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
      });

      handleCastSpell(ctx, {
        type: 'CAST_SPELL',
        playerId,
        cardId,
        targets: [],
      });

      expect(ctx.state.players[playerId].hand).not.toContain(cardId);
    });

    it('creates stack object', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [
          {
            type: 'spell',
            text: 'Deal 3 damage',
            effect: jest.fn(),
            targets: jest.fn().mockReturnValue([]),
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInHand(playerId, testCard, {
        manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
      });

      handleCastSpell(ctx, {
        type: 'CAST_SPELL',
        playerId,
        cardId,
        targets: [],
      });

      expect(ctx.state.stack).toHaveLength(1);
      const stackObject = Array.from(ctx.state.stack)[0];
      expect(stackObject.controllerId).toBe(playerId);
      expect(stackObject.sourceCardId).toBe(cardId);
      expect(stackObject.type).toBe('SPELL');
    });

    it('resets priority passes (rule 117.3c)', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [
          {
            type: 'spell',
            text: 'Deal 3 damage',
            effect: jest.fn(),
            targets: jest.fn().mockReturnValue([]),
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInHand(playerId, testCard, {
        manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
        playersWhoPassedPriority: new Set([playerId]),
      });

      handleCastSpell(ctx, {
        type: 'CAST_SPELL',
        playerId,
        cardId,
        targets: [],
      });

      expect(ctx.state.playersWhoPassedPriority.size).toBe(0);
    });

    it('emits SPELL_CAST event', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [
          {
            type: 'spell',
            text: 'Deal 3 damage',
            effect: jest.fn(),
            targets: jest.fn().mockReturnValue([]),
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInHand(playerId, testCard, {
        manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
      });

      handleCastSpell(ctx, {
        type: 'CAST_SPELL',
        playerId,
        cardId,
        targets: ['target-1' as TargetId],
      });

      expect(ctx.events.some((e) => e.type === 'SPELL_CAST')).toBe(true);
      const castEvent = ctx.events.find((e) => e.type === 'SPELL_CAST');
      expect(castEvent).toMatchObject({
        type: 'SPELL_CAST',
        playerId,
        cardId,
        targets: ['target-1'],
      });
    });

    it('throws error when card is not in hand', () => {
      const playerId = makePlayerId();
      const cardId = makeCardId();
      const ctx = createTestContext({ playerId });

      expect(() => {
        handleCastSpell(ctx, {
          type: 'CAST_SPELL',
          playerId,
          cardId,
          targets: [],
        });
      }).toThrow('Card is not in hand');
    });

    it('throws error when card not found in game state', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [],
      });

      const { ctx, cardId } = createContextWithCardInHand(playerId, testCard);
      ctx.state.cards = {};

      expect(() => {
        handleCastSpell(ctx, {
          type: 'CAST_SPELL',
          playerId,
          cardId,
          targets: [],
        });
      }).toThrow('Card not found in game state');
    });

    it('throws error when card definition missing', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [],
      });

      const { ctx, cardId } = createContextWithCardInHand(playerId, testCard);
      ctx.state.cardDefinitions = {};

      expect(() => {
        handleCastSpell(ctx, {
          type: 'CAST_SPELL',
          playerId,
          cardId,
          targets: [],
        });
      }).toThrow('Card definition missing');
    });

    it('throws error when card cannot be cast as spell', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [], // No spell ability
      });

      const { ctx, cardId } = createContextWithCardInHand(playerId, testCard);

      expect(() => {
        handleCastSpell(ctx, {
          type: 'CAST_SPELL',
          playerId,
          cardId,
          targets: [],
        });
      }).toThrow('Card cannot be cast as a spell');
    });

    it('throws error when casting Lightning Bolt without targets', () => {
      const playerId = makePlayerId();
      const { ctx, cardId } = createContextWithCardInHand(
        playerId,
        lightningBolt,
        {
          manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
        },
      );

      expect(() => {
        handleCastSpell(ctx, {
          type: 'CAST_SPELL',
          playerId,
          cardId,
          targets: [],
        });
      }).toThrow(/requires.*target/i);
    });

    it('throws error when casting Lightning Bolt with invalid target', () => {
      const playerId = makePlayerId();
      const { ctx, cardId } = createContextWithCardInHand(
        playerId,
        lightningBolt,
        {
          manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
        },
      );

      const invalidTarget = 'invalid-target-id' as TargetId;

      expect(() => {
        handleCastSpell(ctx, {
          type: 'CAST_SPELL',
          playerId,
          cardId,
          targets: [invalidTarget],
        });
      }).toThrow(/invalid.*target/i);
    });

    it('throws error when casting Lightning Bolt with wrong number of targets', () => {
      const playerId = makePlayerId();
      const { ctx, cardId } = createContextWithCardInHand(
        playerId,
        lightningBolt,
        {
          manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
        },
      );

      const playerIds = Object.keys(ctx.state.players) as TargetId[];

      expect(() => {
        handleCastSpell(ctx, {
          type: 'CAST_SPELL',
          playerId,
          cardId,
          targets: [playerIds[0], playerIds[1]],
        });
      }).toThrow(/requires.*1.*target/i);
    });

    it('succeeds when casting Lightning Bolt with valid target', () => {
      const playerId = makePlayerId();
      const { ctx, cardId } = createContextWithCardInHand(
        playerId,
        lightningBolt,
        {
          manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
        },
      );

      const playerIds = Object.keys(ctx.state.players) as TargetId[];
      const targetId = playerIds.find((id) => id !== playerId);
      expect(targetId).toBeDefined();
      if (!targetId) {
        throw new Error('No opponent found for targeting test');
      }

      expect(() => {
        handleCastSpell(ctx, {
          type: 'CAST_SPELL',
          playerId,
          cardId,
          targets: [targetId],
        });
      }).not.toThrow();

      expect(ctx.state.stack).toHaveLength(1);
      const stackObject = Array.from(ctx.state.stack)[0];
      expect(stackObject.targets).toEqual([targetId]);
    });

    it('succeeds when casting spell without targeting requirements with empty targets', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{1}'),
        abilities: [
          {
            type: 'spell',
            text: 'Do something',
            effect: jest.fn(),
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInHand(playerId, testCard, {
        manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
      });
      ctx.state.players[playerId].manaPool.W = 1;

      expect(() => {
        handleCastSpell(ctx, {
          type: 'CAST_SPELL',
          playerId,
          cardId,
          targets: [],
        });
      }).not.toThrow();
    });
  });
});
