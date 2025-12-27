import { createContextWithCardInZone } from '@/__tests__/test-utils';

import { defineCard } from '../../card/card';
import { parseManaCost } from '../../costs/mana-costs';
import { makePlayerId } from '../../primitives/id';
import { handleActivateAbility } from './activate-ability';

describe('activate-ability', () => {
  describe('handleActivateAbility', () => {
    it('should route mana abilities to mana ability handler', () => {
      const playerId = makePlayerId();
      const effectSpy = jest.fn();
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
            effect: effectSpy,
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      const initialStackLength = ctx.state.stack.length;

      handleActivateAbility(ctx, {
        type: 'ACTIVATE_ABILITY',
        playerId,
        cardId,
        abilityIndex: 0,
      });

      // Mana abilities should not go on stack
      expect(ctx.state.stack.length).toBe(initialStackLength);
      expect(effectSpy).toHaveBeenCalledTimes(1);
      // Should emit MANA_ABILITY_ACTIVATED event
      expect(ctx.events).toHaveLength(1);
      expect(ctx.events[0].type).toBe('MANA_ABILITY_ACTIVATED');
    });

    it('should put non-mana abilities on the stack without executing effect', () => {
      const playerId = makePlayerId();
      const effectSpy = jest.fn();
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
            effect: effectSpy,
          },
        ],
      });

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        testCard,
        'battlefield',
      );

      const initialStackLength = ctx.state.stack.length;
      const initialLife = ctx.state.players[playerId].life;

      handleActivateAbility(ctx, {
        type: 'ACTIVATE_ABILITY',
        playerId,
        cardId,
        abilityIndex: 0,
      });

      // Non-mana abilities should go on stack
      expect(ctx.state.stack.length).toBe(initialStackLength + 1);
      // Effect should NOT have executed yet (it's on the stack waiting to resolve)
      expect(effectSpy).not.toHaveBeenCalled();
      expect(ctx.state.players[playerId].life).toBe(initialLife);
      // Should emit ABILITY_ACTIVATED event
      expect(ctx.events).toHaveLength(1);
      expect(ctx.events[0].type).toBe('ABILITY_ACTIVATED');
      if (ctx.events[0].type === 'ABILITY_ACTIVATED') {
        expect(ctx.events[0].stackObjectId).toBeDefined();
      }
    });

    it('should pay costs before putting ability on stack', () => {
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

      expect(ctx.state.cards[cardId].tapped).toBe(false);

      handleActivateAbility(ctx, {
        type: 'ACTIVATE_ABILITY',
        playerId,
        cardId,
        abilityIndex: 0,
      });

      // Card should be tapped (cost paid)
      expect(ctx.state.cards[cardId].tapped).toBe(true);
    });
  });
});
