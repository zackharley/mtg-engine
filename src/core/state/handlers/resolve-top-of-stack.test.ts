import { createTestContext } from '@/__tests__/test-utils';

import { defineCard } from '../../card/card';
import { parseManaCost } from '../../costs/mana-costs';
import {
  makeCardDefinitionId,
  makeCardId,
  makePlayerId,
  makeStackObjectId,
} from '../../primitives/id';
import {
  createOrderedStack,
  peekOrderedStack,
  pushOrderedStack,
} from '../../primitives/ordered-stack';
import type { StackObject } from '../../stack/stack';
import type { ReduceContext } from '../reducer';
import handleResolveTopOfStack from './resolve-top-of-stack';

describe('resolve-top-of-stack', () => {
  describe('handleResolveTopOfStack', () => {
    it('executes stack object effect', () => {
      const playerId = makePlayerId();
      const effectFn = jest.fn();
      const stackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        effect: effectFn,
        targets: [],
      };

      const ctx = createTestContext({
        overrides: {
          stack: pushOrderedStack(createOrderedStack(), stackObject),
        },
        playerId,
      });

      handleResolveTopOfStack(ctx, { type: 'RESOLVE_TOP_OF_STACK' });

      expect(effectFn).toHaveBeenCalledWith(ctx);
    });

    it('removes resolved object from stack', () => {
      const playerId = makePlayerId();
      const stackObject1: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        effect: jest.fn(),
        targets: [],
      };
      const stackObject2: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        effect: jest.fn(),
        targets: [],
      };

      let stack = createOrderedStack<StackObject>();
      stack = pushOrderedStack(stack, stackObject1);
      stack = pushOrderedStack(stack, stackObject2);

      const ctx = createTestContext({ overrides: { stack }, playerId });

      handleResolveTopOfStack(ctx, { type: 'RESOLVE_TOP_OF_STACK' });

      expect(ctx.state.stack).toHaveLength(1);
      const remainingObject = peekOrderedStack(ctx.state.stack);
      expect(remainingObject?.id).toEqual(stackObject1.id);
    });

    it('moves instant/sorcery to graveyard after resolution', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'lightning-bolt',
        name: 'Lightning Bolt',
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

      const cardId = makeCardId();
      const stackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        sourceCardId: cardId,
        effect: jest.fn(),
        targets: [],
      };

      const ctx = createTestContext({
        overrides: {
          stack: pushOrderedStack(createOrderedStack(), stackObject),
          cards: {
            [cardId]: {
              id: cardId,
              definitionId: testCard.id,
              controllerId: playerId,
              tapped: false,
            },
          },
          cardDefinitions: {
            [testCard.id]: testCard,
          },
        },
        playerId,
      });

      handleResolveTopOfStack(ctx, { type: 'RESOLVE_TOP_OF_STACK' });

      const graveyard = Array.from(ctx.state.players[playerId].graveyard);
      expect(graveyard).toContain(cardId);
    });

    it('emits SPELL_RESOLVED event when sourceCardId exists', () => {
      const playerId = makePlayerId();
      const cardId = makeCardId();
      const stackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        sourceCardId: cardId,
        effect: jest.fn(),
        targets: [],
      };

      const ctx = createTestContext({
        overrides: {
          stack: pushOrderedStack(createOrderedStack(), stackObject),
          cards: {
            [cardId]: {
              id: cardId,
              definitionId: makeCardDefinitionId(),
              controllerId: playerId,
              tapped: false,
            },
          },
        },
        playerId,
      });

      handleResolveTopOfStack(ctx, { type: 'RESOLVE_TOP_OF_STACK' });

      expect(ctx.events.some((e) => e.type === 'SPELL_RESOLVED')).toBe(true);
      const resolvedEvent = ctx.events.find((e) => e.type === 'SPELL_RESOLVED');
      expect(resolvedEvent).toMatchObject({
        type: 'SPELL_RESOLVED',
        playerId,
        cardId,
      });
    });

    it('emits CARD_MOVED event when sourceCardId exists', () => {
      const playerId = makePlayerId();
      const cardId = makeCardId();
      const stackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        sourceCardId: cardId,
        effect: jest.fn(),
        targets: [],
      };

      const ctx = createTestContext({
        overrides: {
          stack: pushOrderedStack(createOrderedStack(), stackObject),
          cards: {
            [cardId]: {
              id: cardId,
              definitionId: makeCardDefinitionId(),
              controllerId: playerId,
              tapped: false,
            },
          },
        },
        playerId,
      });

      handleResolveTopOfStack(ctx, { type: 'RESOLVE_TOP_OF_STACK' });

      expect(ctx.events.some((e) => e.type === 'CARD_MOVED')).toBe(true);
      const movedEvent = ctx.events.find((e) => e.type === 'CARD_MOVED');
      expect(movedEvent).toMatchObject({
        type: 'CARD_MOVED',
        cardId,
        from: 'stack',
        to: 'graveyard',
      });
    });

    it('does not emit events when sourceCardId is undefined', () => {
      const playerId = makePlayerId();
      const stackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'ABILITY',
        effect: jest.fn(),
        targets: [],
      };

      const ctx = createTestContext({
        overrides: {
          stack: pushOrderedStack(createOrderedStack(), stackObject),
        },
        playerId,
      });

      handleResolveTopOfStack(ctx, { type: 'RESOLVE_TOP_OF_STACK' });

      expect(ctx.events.some((e) => e.type === 'SPELL_RESOLVED')).toBe(false);
      expect(ctx.events.some((e) => e.type === 'CARD_MOVED')).toBe(false);
    });

    it('throws error when stack is empty', () => {
      const ctx = createTestContext({
        overrides: {
          stack: createOrderedStack(),
        },
      });

      expect(() => {
        handleResolveTopOfStack(ctx, { type: 'RESOLVE_TOP_OF_STACK' });
      }).toThrow('Stack is empty');
    });

    it('allows effect to modify state through context', () => {
      const playerId = makePlayerId();
      const effectFn = jest.fn((ctx: ReduceContext) => {
        ctx.state.players[playerId].life = 15;
      });
      const stackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        effect: effectFn,
        targets: [],
      };

      const ctx = createTestContext({
        overrides: {
          stack: pushOrderedStack(createOrderedStack(), stackObject),
        },
        playerId,
      });

      handleResolveTopOfStack(ctx, { type: 'RESOLVE_TOP_OF_STACK' });

      expect(ctx.state.players[playerId].life).toBe(15);
    });
  });
});
