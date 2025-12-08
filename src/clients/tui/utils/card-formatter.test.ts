import lightningBolt from '@/card-definitions/cards/lightning-bolt/card';
import mountain from '@/card-definitions/cards/mountain/card';
import { makeCardId, makePlayerId } from '@/core/primitives/id';
import { createOrderedStack } from '@/core/primitives/ordered-stack';
import type { GameState } from '@/core/state/state';
import { Phase, Step } from '@/core/turn/turn-structure';

import {
  formatCardFull,
  formatCardName,
  formatCardShort,
  formatCardType,
  formatManaCost,
} from './card-formatter';

describe('card-formatter', () => {
  describe('formatCardName', () => {
    it('formats card name correctly', () => {
      const state = createMockState();
      const cardId = makeCardId();
      state.cards[cardId] = {
        id: cardId,
        definitionId: lightningBolt.id,
        controllerId: makePlayerId(),
      };
      state.cardDefinitions[lightningBolt.id] = lightningBolt;

      const result = formatCardName(cardId, state);
      expect(result).toBe('Lightning Bolt');
    });

    it('handles unknown card', () => {
      const state = createMockState();
      const cardId = makeCardId();
      const result = formatCardName(cardId, state);
      expect(result).toBe('[Unknown Card]');
    });
  });

  describe('formatManaCost', () => {
    it('formats mana cost with raw string', () => {
      const manaCost = { pips: [], raw: '{R}' };
      const result = formatManaCost(manaCost);
      expect(result).toBe('{R}');
    });
  });

  describe('formatCardType', () => {
    it('formats card type correctly', () => {
      const result = formatCardType(lightningBolt);
      expect(result).toBe('instant');
    });
  });

  describe('formatCardShort', () => {
    it('formats card in short format', () => {
      const state = createMockState();
      const cardId = makeCardId();
      state.cards[cardId] = {
        id: cardId,
        definitionId: lightningBolt.id,
        controllerId: makePlayerId(),
      };
      state.cardDefinitions[lightningBolt.id] = lightningBolt;

      const result = formatCardShort(cardId, state);
      expect(result).toContain('Lightning Bolt');
      expect(result).toContain('instant');
    });
  });

  describe('formatCardFull', () => {
    it('formats card with full details', () => {
      const state = createMockState();
      const cardId = makeCardId();
      state.cards[cardId] = {
        id: cardId,
        definitionId: lightningBolt.id,
        controllerId: makePlayerId(),
        tapped: false,
      };
      state.cardDefinitions[lightningBolt.id] = lightningBolt;

      const result = formatCardFull(cardId, state);
      expect(result).toContain('Lightning Bolt');
      expect(result).toContain('instant');
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

      const result = formatCardFull(cardId, state);
      expect(result).toContain('TAPPED');
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
