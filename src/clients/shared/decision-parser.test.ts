import lightningBolt from '@/card-definitions/cards/lightning-bolt/card';
import mountain from '@/card-definitions/cards/mountain/card';
import { makeCardId, makePlayerId } from '@/core/primitives/id';
import { createOrderedStack } from '@/core/primitives/ordered-stack';
import type { AvailablePlayerDecision } from '@/core/state/reducer';
import type { GameState } from '@/core/state/state';
import { Phase, Step } from '@/core/turn/turn-structure';

import { parseDecisionInput } from './decision-parser';

describe('decision-parser', () => {
  describe('parseDecisionInput', () => {
    it('parses pass priority command', () => {
      const state = createMockState();
      const availableDecisions: AvailablePlayerDecision[] = [
        { type: 'PASS_PRIORITY' },
      ];

      const result = parseDecisionInput('pass', availableDecisions, state);
      expect(result).toEqual({ type: 'PASS_PRIORITY' });

      const result2 = parseDecisionInput('p', availableDecisions, state);
      expect(result2).toEqual({ type: 'PASS_PRIORITY' });
    });

    it('parses numeric input for decision selection', () => {
      const state = createMockState();
      const cardId = makeCardId();
      state.cards[cardId] = {
        id: cardId,
        definitionId: lightningBolt.id,
        controllerId: makePlayerId(),
      };
      state.cardDefinitions[lightningBolt.id] = lightningBolt;

      const availableDecisions: AvailablePlayerDecision[] = [
        { type: 'CAST_SPELL', cardId },
        { type: 'PASS_PRIORITY' },
      ];

      const result = parseDecisionInput('1', availableDecisions, state);
      expect(result).toEqual({ type: 'CAST_SPELL', cardId });
    });

    it('parses play land command', () => {
      const state = createMockState();
      const cardId = makeCardId();
      state.cards[cardId] = {
        id: cardId,
        definitionId: mountain.id,
        controllerId: makePlayerId(),
      };
      state.cardDefinitions[mountain.id] = mountain;

      const availableDecisions: AvailablePlayerDecision[] = [
        { type: 'PLAY_LAND', cardId },
      ];

      const result = parseDecisionInput(
        'play mountain',
        availableDecisions,
        state,
      );
      expect(result).toEqual({ type: 'PLAY_LAND', cardId });
    });

    it('parses cast spell command', () => {
      const state = createMockState();
      const cardId = makeCardId();
      state.cards[cardId] = {
        id: cardId,
        definitionId: lightningBolt.id,
        controllerId: makePlayerId(),
      };
      state.cardDefinitions[lightningBolt.id] = lightningBolt;

      const availableDecisions: AvailablePlayerDecision[] = [
        { type: 'CAST_SPELL', cardId },
      ];

      const result = parseDecisionInput(
        'cast lightning bolt',
        availableDecisions,
        state,
      );
      expect(result).toEqual({ type: 'CAST_SPELL', cardId });
    });

    it('parses tap permanent command', () => {
      const state = createMockState();
      const cardId = makeCardId();
      state.cards[cardId] = {
        id: cardId,
        definitionId: mountain.id,
        controllerId: makePlayerId(),
      };
      state.cardDefinitions[mountain.id] = mountain;

      const availableDecisions: AvailablePlayerDecision[] = [
        { type: 'TAP_PERMANENT_FOR_MANA', cardId },
      ];

      const result = parseDecisionInput(
        'tap mountain',
        availableDecisions,
        state,
      );
      expect(result).toEqual({ type: 'TAP_PERMANENT_FOR_MANA', cardId });
    });

    it('returns null for invalid input', () => {
      const state = createMockState();
      const availableDecisions: AvailablePlayerDecision[] = [
        { type: 'PASS_PRIORITY' },
      ];

      const result = parseDecisionInput('invalid', availableDecisions, state);
      expect(result).toBeNull();
    });

    it('handles case-insensitive card name matching', () => {
      const state = createMockState();
      const cardId = makeCardId();
      state.cards[cardId] = {
        id: cardId,
        definitionId: lightningBolt.id,
        controllerId: makePlayerId(),
      };
      state.cardDefinitions[lightningBolt.id] = lightningBolt;

      const availableDecisions: AvailablePlayerDecision[] = [
        { type: 'CAST_SPELL', cardId },
      ];

      const result = parseDecisionInput(
        'CAST LIGHTNING BOLT',
        availableDecisions,
        state,
      );
      expect(result).toEqual({ type: 'CAST_SPELL', cardId });
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
