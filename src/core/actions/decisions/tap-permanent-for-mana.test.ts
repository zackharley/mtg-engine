import { createTestContext } from '@/__tests__/test-utils';

import { defineCard } from '../../card/card';
import { parseManaCost } from '../../costs/mana-costs';
import { registerCardForPlayer } from '../../deck/deck';
import { makePlayerId } from '../../primitives/id';
import { createOrderedStack } from '../../primitives/ordered-stack';
import type { AvailablePlayerDecision } from '../../state/reducer';
import { addTapPermanentForManaDecisions } from './tap-permanent-for-mana';

const basicLandNames = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest'];

describe('tap-permanent-for-mana decisions', () => {
  describe('addTapPermanentForManaDecisions', () => {
    it.each(basicLandNames)(
      'adds TAP_PERMANENT_FOR_MANA for %s on battlefield',
      (landName) => {
        const playerId = makePlayerId();
        const land = defineCard({
          scryfallId: landName.toLowerCase(),
          name: landName,
          type: 'land',
          manaCost: parseManaCost(''),
          abilities: [],
        });

        const ctx = createTestContext({ playerId });
        let state = ctx.state;
        state = registerCardForPlayer(state, playerId, land, 1);
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

        const initialDecisions: AvailablePlayerDecision[] = [];
        const decisions = addTapPermanentForManaDecisions(
          state,
          playerId,
          initialDecisions,
        );

        expect(decisions).toHaveLength(1);
        expect(decisions[0]).toEqual({
          type: 'TAP_PERMANENT_FOR_MANA',
          cardId,
        });
      },
    );

    it('does not add TAP_PERMANENT_FOR_MANA for tapped permanents', () => {
      const playerId = makePlayerId();
      const mountain = defineCard({
        scryfallId: 'mountain',
        name: 'Mountain',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const ctx = createTestContext({ playerId });
      let state = ctx.state;
      state = registerCardForPlayer(state, playerId, mountain, 1);
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
            tapped: true,
          },
        },
      };

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addTapPermanentForManaDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(0);
    });

    it.each(basicLandNames)(
      'adds multiple TAP_PERMANENT_FOR_MANA for multiple %s',
      (landName) => {
        const playerId = makePlayerId();
        const land = defineCard({
          scryfallId: landName.toLowerCase(),
          name: landName,
          type: 'land',
          manaCost: parseManaCost(''),
          abilities: [],
        });

        const ctx = createTestContext({ playerId });
        let state = ctx.state;
        state = registerCardForPlayer(state, playerId, land, 2);
        const cardIds = Array.from(state.players[playerId].library);
        state = {
          ...state,
          players: {
            ...state.players,
            [playerId]: {
              ...state.players[playerId],
              battlefield: cardIds,
              library: createOrderedStack(),
            },
          },
          cards: {
            ...state.cards,
            [cardIds[0]]: {
              ...state.cards[cardIds[0]],
              tapped: false,
            },
            [cardIds[1]]: {
              ...state.cards[cardIds[1]],
              tapped: false,
            },
          },
        };

        const initialDecisions: AvailablePlayerDecision[] = [];
        const decisions = addTapPermanentForManaDecisions(
          state,
          playerId,
          initialDecisions,
        );

        expect(decisions).toHaveLength(2);
        expect(decisions[0]).toEqual({
          type: 'TAP_PERMANENT_FOR_MANA',
          cardId: cardIds[0],
        });
        expect(decisions[1]).toEqual({
          type: 'TAP_PERMANENT_FOR_MANA',
          cardId: cardIds[1],
        });
      },
    );

    it('returns decisions unchanged when player not found', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {},
        },
      });

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addTapPermanentForManaDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toBe(initialDecisions);
      expect(decisions).toHaveLength(0);
    });

    it('preserves existing decisions and adds new ones', () => {
      const playerId = makePlayerId();
      const mountain = defineCard({
        scryfallId: 'mountain',
        name: 'Mountain',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const ctx = createTestContext({ playerId });
      let state = ctx.state;
      state = registerCardForPlayer(state, playerId, mountain, 1);
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

      const existingDecision = { type: 'PASS_PRIORITY' as const };
      const initialDecisions = [existingDecision];
      const decisions = addTapPermanentForManaDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(2);
      expect(decisions[0]).toEqual(existingDecision);
      expect(decisions[1]).toEqual({
        type: 'TAP_PERMANENT_FOR_MANA',
        cardId,
      });
    });

    it('does not mutate the original decisions array', () => {
      const playerId = makePlayerId();
      const mountain = defineCard({
        scryfallId: 'mountain',
        name: 'Mountain',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const ctx = createTestContext({ playerId });
      let state = ctx.state;
      state = registerCardForPlayer(state, playerId, mountain, 1);
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

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addTapPermanentForManaDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).not.toBe(initialDecisions);
      expect(initialDecisions).toHaveLength(0);
      expect(decisions).toHaveLength(1);
    });
  });
});
