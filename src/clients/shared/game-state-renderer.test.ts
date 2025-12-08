import lightningBolt from '@/card-definitions/lightning-bolt/card';
import mountain from '@/card-definitions/mountain/card';
import { makeCardId, makePlayerId } from '@/core/primitives/id';
import { createOrderedStack } from '@/core/primitives/ordered-stack';
import type { GameState } from '@/core/state/state';
import { Phase, Step } from '@/core/turn/turn-structure';

import {
  formatBattlefield,
  formatHand,
  formatManaPool,
  formatPlayerInfo,
  formatStack,
  formatTurnInfo,
} from './game-state-renderer';

describe('game-state-renderer', () => {
  describe('formatPlayerInfo', () => {
    it('formats player info correctly', () => {
      const playerId = makePlayerId();
      const _cardId1 = makeCardId();
      const player = {
        name: 'Alice',
        life: 20,
        manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
        hand: [],
        battlefield: [],
        graveyard: createOrderedStack<typeof _cardId1>(),
        library: createOrderedStack<typeof _cardId1>(),
        commandZone: [],
      };
      const result = formatPlayerInfo(player, playerId);
      // Inactive players have 2 spaces reserved for alignment
      expect(result).toBe('  Alice (Life: 20)');
    });

    it('formats active player info with indicator', () => {
      const playerId = makePlayerId();
      const _cardId1 = makeCardId();
      const player = {
        name: 'Bob',
        life: 15,
        manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
        hand: [],
        battlefield: [],
        graveyard: createOrderedStack<typeof _cardId1>(),
        library: createOrderedStack<typeof _cardId1>(),
        commandZone: [],
      };
      const result = formatPlayerInfo(player, playerId, true);
      expect(result).toContain('▶');
      expect(result).toContain('Bob');
      expect(result).toContain('Life: 15');
      expect(result).toContain('{green-fg}');
    });
  });

  describe('formatManaPool', () => {
    it('formats empty mana pool', () => {
      const manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0 };
      const result = formatManaPool(manaPool);
      expect(result).toBe('No mana');
    });

    it('formats mana pool with mana', () => {
      const manaPool = { W: 1, U: 0, B: 0, R: 2, G: 1 };
      const result = formatManaPool(manaPool);
      expect(result).toBe('W:1 R:2 G:1');
    });
  });

  describe('formatHand', () => {
    it('formats empty hand', () => {
      const state = createMockState();
      const result = formatHand([], state);
      expect(result).toEqual([]);
    });

    it('formats hand with cards', () => {
      const state = createMockState();
      const cardId1 = makeCardId();
      const cardId2 = makeCardId();

      state.cards[cardId1] = {
        id: cardId1,
        definitionId: lightningBolt.id,
        controllerId: makePlayerId(),
      };
      state.cards[cardId2] = {
        id: cardId2,
        definitionId: mountain.id,
        controllerId: makePlayerId(),
      };
      state.cardDefinitions[lightningBolt.id] = lightningBolt;
      state.cardDefinitions[mountain.id] = mountain;

      const result = formatHand([cardId1, cardId2], state);
      expect(result).toHaveLength(2);
      expect(result[0]).toContain('Lightning Bolt');
      expect(result[1]).toContain('Mountain');
    });
  });

  describe('formatBattlefield', () => {
    it('formats empty battlefield', () => {
      const state = createMockState();
      const result = formatBattlefield([], state);
      expect(result).toEqual(['(No permanents)']);
    });

    it('formats battlefield with permanents', () => {
      const state = createMockState();
      const cardId = makeCardId();

      state.cards[cardId] = {
        id: cardId,
        definitionId: mountain.id,
        controllerId: makePlayerId(),
        tapped: false,
      };
      state.cardDefinitions[mountain.id] = mountain;

      const result = formatBattlefield([cardId], state);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('Mountain');
    });

    it('shows tapped status', () => {
      const state = createMockState();
      const cardId = makeCardId();

      state.cards[cardId] = {
        id: cardId,
        definitionId: mountain.id,
        controllerId: makePlayerId(),
        tapped: true,
      };
      state.cardDefinitions[mountain.id] = mountain;

      const result = formatBattlefield([cardId], state);
      expect(result[0]).toContain('TAPPED');
    });
  });

  describe('formatStack', () => {
    it('formats empty stack', () => {
      const state = createMockState();
      const result = formatStack(state.stack, state);
      expect(result).toEqual(['(Stack is empty)']);
    });
  });

  describe('formatTurnInfo', () => {
    it('formats turn info correctly', () => {
      const turn = {
        activePlayerId: makePlayerId(),
        startingPlayerId: makePlayerId(),
        phase: Phase.BEGINNING,
        step: Step.UNTAP,
        turnNumber: 1,
        landPlayedThisTurn: 0,
      };
      const result = formatTurnInfo(turn);
      expect(result).toBe('Turn 1 - BEGINNING / UNTAP');
    });

    it('formats turn info without step when step is null', () => {
      const turn = {
        activePlayerId: makePlayerId(),
        startingPlayerId: makePlayerId(),
        phase: Phase.BEGINNING,
        step: null,
        turnNumber: 1,
        landPlayedThisTurn: 0,
      };
      const result = formatTurnInfo(turn);
      expect(result).toBe('Turn 1 - BEGINNING');
    });
  });
});

function createMockState(): GameState {
  return {
    players: {},
    cards: {},
    cardDefinitions: {},
    stack: createOrderedStack(),
    turn: {
      activePlayerId: makePlayerId(),
      startingPlayerId: makePlayerId(),
      phase: Phase.BEGINNING,
      step: Step.UNTAP,
      turnNumber: 1,
      landPlayedThisTurn: 0,
    },
    gameEnded: false,
    playersWhoPassedPriority: new Set(),
    rng: () => Math.random(),
  };
}
