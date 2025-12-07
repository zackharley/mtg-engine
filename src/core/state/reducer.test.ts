import { createTestContext } from '@/__tests__/test-utils';

import { defineCard } from '../card/card';
import { parseManaCost } from '../costs/mana-costs';
import { registerCardForPlayer } from '../deck/deck';
import { makePlayerId, makeStackObjectId } from '../primitives/id';
import {
  createOrderedStack,
  pushOrderedStack,
} from '../primitives/ordered-stack';
import type { StackObject } from '../stack/stack';
import { Phase, Step } from '../turn/turn-structure';
import { reduce } from './reducer';

describe('reducer', () => {
  describe('reduce', () => {
    it('returns state and events', () => {
      const ctx = createTestContext();

      const result = reduce(ctx.state, { type: 'ADVANCE_TO_NEXT_STEP' });

      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('events');
      expect(Array.isArray(result.events)).toBe(true);
    });

    it('returns new state object (immutability)', () => {
      const ctx = createTestContext();

      const result = reduce(ctx.state, { type: 'ADVANCE_TO_NEXT_STEP' });

      expect(result.state).not.toBe(ctx.state);
    });

    it('routes CAST_SPELL action to handleCastSpell', () => {
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

      const ctx = createTestContext({ playerId });
      let state = ctx.state;
      state = registerCardForPlayer(state, playerId, testCard, 1);
      const cardId = Array.from(state.players[playerId].library)[0];
      state = {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...state.players[playerId],
            hand: [cardId],
            library: createOrderedStack(),

            manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
          },
        },
      };

      const result = reduce(state, {
        type: 'CAST_SPELL',
        playerId,
        cardId,
        targets: [],
      });

      expect(result.events.some((e) => e.type === 'SPELL_CAST')).toBe(true);
      expect(result.state.players[playerId].hand).not.toContain(cardId);
    });

    it('routes DRAW_CARD action to handleDrawCard', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{1}'),
        abilities: [],
      });

      const ctx = createTestContext({ playerId });
      let state = ctx.state;
      state = registerCardForPlayer(state, playerId, testCard, 1);

      const result = reduce(state, {
        type: 'DRAW_CARD',
        playerId,
      });

      expect(result.state.players[playerId].hand).toHaveLength(1);
      expect(result.state.players[playerId].library).toHaveLength(0);
    });

    it('routes PLAY_LAND action to handlePlayLand', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const ctx = createTestContext({
        playerId,
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.PRECOMBAT_MAIN,
            step: null,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });
      let state = ctx.state;
      state = registerCardForPlayer(state, playerId, testCard, 1);
      const cardId = Array.from(state.players[playerId].library)[0];
      state = {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...state.players[playerId],
            hand: [cardId],
            library: createOrderedStack(),
          },
        },
      };

      const result = reduce(state, {
        type: 'PLAY_LAND',
        playerId,
        cardId,
      });

      expect(result.events.some((e) => e.type === 'CARD_MOVED')).toBe(true);
      expect(result.state.players[playerId].battlefield).toContain(cardId);
      expect(result.state.players[playerId].hand).not.toContain(cardId);
    });

    it('routes TAP_PERMANENT_FOR_MANA action to handleTapPermanentForMana', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'mountain',
        name: 'Mountain',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const ctx = createTestContext({ playerId });
      let state = ctx.state;
      state = registerCardForPlayer(state, playerId, testCard, 1);
      const cardId = Array.from(state.players[playerId].library)[0];
      state = {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...state.players[playerId],
            battlefield: [cardId],
            library: createOrderedStack(),
          },
        },
        cards: {
          ...state.cards,
          [cardId]: {
            ...state.cards[cardId],
            tapped: false,
          },
        },
      };

      const result = reduce(state, {
        type: 'TAP_PERMANENT_FOR_MANA',
        playerId,
        cardId,
      });

      expect(result.events.some((e) => e.type === 'MANA_ADDED')).toBe(true);
      expect(result.state.cards[cardId].tapped).toBe(true);
      expect(result.state.players[playerId].manaPool.R).toBe(1);
    });

    it('routes RESOLVE_TOP_OF_STACK action to handleResolveTopOfStack', () => {
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
      });

      const result = reduce(ctx.state, {
        type: 'RESOLVE_TOP_OF_STACK',
      });

      expect(effectFn).toHaveBeenCalled();
      expect(result.state.stack).toHaveLength(0);
    });

    it('routes ADVANCE_TO_NEXT_STEP action to handleAdvanceToNextStep', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.UNTAP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      const result = reduce(ctx.state, {
        type: 'ADVANCE_TO_NEXT_STEP',
      });

      expect(result.state.turn.step).toBe(Step.UPKEEP);
    });

    it('collects events from handlers', () => {
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

      const ctx = createTestContext({ playerId });
      let state = ctx.state;
      state = registerCardForPlayer(state, playerId, testCard, 1);
      const cardId = Array.from(state.players[playerId].library)[0];
      state = {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...state.players[playerId],
            hand: [cardId],
            library: createOrderedStack(),
            manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
          },
        },
      };

      const result = reduce(state, {
        type: 'CAST_SPELL',
        playerId,
        cardId,
        targets: [],
      });

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events.some((e) => e.type === 'SPELL_CAST')).toBe(true);
    });

    it('creates context with cloned state', () => {
      const ctx = createTestContext();
      const state = ctx.state;

      const result = reduce(state, { type: 'ADVANCE_TO_NEXT_STEP' });

      // State should be cloned, not mutated
      expect(result.state).not.toBe(state);
      expect(result.state.players).not.toBe(state.players);
    });

    it('initializes events array in context', () => {
      const ctx = createTestContext();

      const result = reduce(ctx.state, { type: 'ADVANCE_TO_NEXT_STEP' });

      expect(Array.isArray(result.events)).toBe(true);
    });
  });
});
