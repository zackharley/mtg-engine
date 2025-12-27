import {
  createContextWithCardInZone,
  createTestContext,
} from '@/__tests__/test-utils';

import { type AbilityCost, defineCard } from '../../card/card';
import { parseManaCost } from '../../costs/mana-costs';
import { addMana } from '../../costs/mana-pool';
import { makeCardId, makePlayerId } from '../../primitives/id';
import type { ReduceContext } from '../reducer';
import {
  handleActivateManaAbility,
  payActivationCosts,
  validateAbilityActivation,
} from './activate-mana-ability';

describe('activate-mana-ability', () => {
  describe('validateAbilityActivation', () => {
    it('should validate a valid ability activation', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: Add {G}.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: true,
            effect: jest.fn(),
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      const result = validateAbilityActivation(ctx.state, playerId, cardId, 0);

      expect(result.ability).toBeDefined();
      expect(result.ability.type).toBe('activated');
    });

    it('should throw if card is not found', () => {
      const playerId = makePlayerId();
      const cardId = makeCardId();
      const ctx = createTestContext({ playerId });

      expect(() => {
        validateAbilityActivation(ctx.state, playerId, cardId, 0);
      }).toThrow('Card not found');
    });

    it('should throw if player does not control the permanent', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: Add {G}.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: true,
            effect: jest.fn(),
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerOne,
        testCard,
        'battlefield',
      );

      expect(() => {
        validateAbilityActivation(ctx.state, playerTwo, cardId, 0);
      }).toThrow('Cannot activate ability of a permanent you do not control');
    });

    it('should throw if permanent is not on the battlefield', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: Add {G}.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: true,
            effect: jest.fn(),
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'hand',
      );

      expect(() => {
        validateAbilityActivation(ctx.state, playerId, cardId, 0);
      }).toThrow('Permanent is not on the battlefield');
    });

    it('should throw if ability index is invalid', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: Add {G}.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: true,
            effect: jest.fn(),
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      expect(() => {
        validateAbilityActivation(ctx.state, playerId, cardId, 999);
      }).toThrow('Ability at index 999 not found');
    });

    it('should throw if ability is not activated', () => {
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
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      expect(() => {
        validateAbilityActivation(ctx.state, playerId, cardId, 0);
      }).toThrow('Only activated abilities can be activated');
    });
  });

  describe('payActivationCosts', () => {
    it('should pay TAP_SOURCE cost', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      const costs: AbilityCost[] = [{ kind: 'TAP_SOURCE' }];

      const newState = payActivationCosts(ctx.state, playerId, costs, cardId);

      expect(newState.cards[cardId].tapped).toBe(true);
    });

    it('should throw if trying to tap an already tapped permanent', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      ctx.state.cards[cardId].tapped = true;

      const costs: AbilityCost[] = [{ kind: 'TAP_SOURCE' }];

      expect(() => {
        payActivationCosts(ctx.state, playerId, costs, cardId);
      }).toThrow('Permanent is already tapped');
    });

    it('should pay MANA cost', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      ctx.state.players[playerId].manaPool.R = 2;

      const costs: AbilityCost[] = [
        { kind: 'MANA', manaCost: parseManaCost('{R}') },
      ];

      const newState = payActivationCosts(ctx.state, playerId, costs, cardId);

      expect(newState.players[playerId].manaPool.R).toBe(1);
    });

    it('should pay PAY_LIFE cost', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      ctx.state.players[playerId].life = 20;

      const costs: AbilityCost[] = [{ kind: 'PAY_LIFE', amount: 3 }];

      const newState = payActivationCosts(ctx.state, playerId, costs, cardId);

      expect(newState.players[playerId].life).toBe(17);
    });

    it('should throw if player does not have enough life', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      ctx.state.players[playerId].life = 2;

      const costs: AbilityCost[] = [{ kind: 'PAY_LIFE', amount: 3 }];

      expect(() => {
        payActivationCosts(ctx.state, playerId, costs, cardId);
      }).toThrow('Insufficient life to pay cost');
    });

    it('should pay multiple costs in sequence', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      ctx.state.players[playerId].manaPool.R = 1;
      ctx.state.players[playerId].life = 20;

      const costs: AbilityCost[] = [
        { kind: 'TAP_SOURCE' },
        { kind: 'MANA', manaCost: parseManaCost('{R}') },
        { kind: 'PAY_LIFE', amount: 2 },
      ];

      const newState = payActivationCosts(ctx.state, playerId, costs, cardId);

      expect(newState.cards[cardId].tapped).toBe(true);
      expect(newState.players[playerId].manaPool.R).toBe(0);
      expect(newState.players[playerId].life).toBe(18);
    });
  });

  describe('handleActivateManaAbility', () => {
    it('should activate a mana ability and add mana immediately', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: Add {G}.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: true,
            effect: (ctx: ReduceContext, args) => {
              ctx.state = addMana(ctx.state, args.controllerId, 'G', 1);
            },
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      const initialMana = ctx.state.players[playerId].manaPool.G;
      const initialStackLength = ctx.state.stack.length;

      handleActivateManaAbility(ctx, {
        type: 'ACTIVATE_ABILITY',
        playerId,
        cardId,
        abilityIndex: 0,
      });

      // Mana should be added immediately
      expect(ctx.state.players[playerId].manaPool.G).toBe(initialMana + 1);
      // Should not go on stack
      expect(ctx.state.stack.length).toBe(initialStackLength);
      // Card should be tapped
      expect(ctx.state.cards[cardId].tapped).toBe(true);
      // Event should be emitted
      expect(ctx.events).toHaveLength(1);
      expect(ctx.events[0].type).toBe('MANA_ABILITY_ACTIVATED');
    });

    it('should throw if ability is not a mana ability', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-creature',
        name: 'Test Creature',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: You gain 1 life.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: false,
            effect: jest.fn(),
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      expect(() => {
        handleActivateManaAbility(ctx, {
          type: 'ACTIVATE_ABILITY',
          playerId,
          cardId,
          abilityIndex: 0,
        });
      }).toThrow('Ability is not a mana ability');
    });
  });
});
