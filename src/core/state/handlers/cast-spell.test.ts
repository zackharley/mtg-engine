import {
  createContextWithCardInHand,
  createTestContext,
} from '@/__tests__/test-utils';
import { registerCardForPlayer } from '@/core/deck/deck';

import { defineCard } from '../../card/card';
import { parseManaCost } from '../../costs/mana-costs';
import {
  makeCardDefinitionId,
  makeCardId,
  makePlayerId,
} from '../../primitives/id';
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
        targets: ['target-1' as any],
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
  });
});
