import { createTestContext } from '@/__tests__/test-utils';

import { defineCard } from '../card/card';
import { parseManaCost } from '../costs/mana-costs';
import { registerCardForPlayer } from '../deck/deck';
import { makePlayerId } from '../primitives/id';
import { createOrderedStack } from '../primitives/ordered-stack';
import { Phase } from '../turn/turn-structure';
import { getAvailableDecisions } from './available-decisions';

describe('available-decisions', () => {
  describe('getAvailableDecisions', () => {
    it('combines decisions from all decision functions in the pipeline', () => {
      const playerId = makePlayerId();
      const land = defineCard({
        scryfallId: 'land',
        name: 'Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });
      const spell = defineCard({
        scryfallId: 'spell',
        name: 'Spell',
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
      const mountain = defineCard({
        scryfallId: 'mountain',
        name: 'Mountain',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const ctx = createTestContext({
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
        playerId,
      });

      // Register all cards at once
      let state = ctx.state;
      state = registerCardForPlayer(state, playerId, land, 1);
      state = registerCardForPlayer(state, playerId, spell, 1);
      state = registerCardForPlayer(state, playerId, mountain, 1);

      // Get card IDs from the library (they should be in order)
      const libraryCards = Array.from(state.players[playerId].library);
      const landCardId = libraryCards[0];
      const spellCardId = libraryCards[1];
      const mountainCardId = libraryCards[2];

      // Put land and spell in hand, mountain on battlefield
      state = {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...state.players[playerId],
            hand: [landCardId, spellCardId],
            battlefield: [mountainCardId],
            library: createOrderedStack(),
          },
        },
        cards: {
          ...state.cards,
          [mountainCardId]: {
            ...state.cards[mountainCardId],
            tapped: false,
          },
        },
      };

      const decisions = getAvailableDecisions(state, playerId);

      // Should have PLAY_LAND, CAST_SPELL, TAP_PERMANENT_FOR_MANA, PASS_PRIORITY, and END_GAME
      expect(decisions).toHaveLength(5);
      expect(decisions.some((d) => d.type === 'PLAY_LAND')).toBe(true);
      expect(decisions.some((d) => d.type === 'CAST_SPELL')).toBe(true);
      expect(decisions.some((d) => d.type === 'TAP_PERMANENT_FOR_MANA')).toBe(
        true,
      );
      expect(decisions.some((d) => d.type === 'PASS_PRIORITY')).toBe(true);
      expect(decisions.some((d) => d.type === 'END_GAME')).toBe(true);
    });

    it('preserves decisions from earlier functions when later functions add decisions', () => {
      const playerId = makePlayerId();
      const land = defineCard({
        scryfallId: 'land',
        name: 'Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const ctx = createTestContext({
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
        playerId,
      });
      let state = ctx.state;
      state = registerCardForPlayer(state, playerId, land, 1);
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

      const decisions = getAvailableDecisions(state, playerId);

      expect(decisions.length).toBeGreaterThanOrEqual(3);
      expect(decisions.some((d) => d.type === 'PLAY_LAND')).toBe(true);
      expect(decisions.some((d) => d.type === 'PASS_PRIORITY')).toBe(true);
      expect(decisions.some((d) => d.type === 'END_GAME')).toBe(true);
    });

    it('returns empty array when player not found', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {},
        },
      });

      const decisions = getAvailableDecisions(ctx.state, playerId);

      expect(decisions).toEqual([]);
    });

    it('always includes PASS_PRIORITY and END_GAME decisions', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      const decisions = getAvailableDecisions(ctx.state, playerId);

      expect(decisions.some((d) => d.type === 'PASS_PRIORITY')).toBe(true);
      expect(decisions.some((d) => d.type === 'END_GAME')).toBe(true);
    });
  });
});
