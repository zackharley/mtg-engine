import {
  createContextWithCardInZone,
  createTestContext,
  createTestPlayer,
} from '@/__tests__/test-utils';
import forest from '@/card-definitions/cards/forest/card';
import island from '@/card-definitions/cards/island/card';
import mountain from '@/card-definitions/cards/mountain/card';
import plains from '@/card-definitions/cards/plains/card';
import swamp from '@/card-definitions/cards/swamp/card';
import type { ManaColor } from '@/core/costs/mana-costs';

import { registerCardForPlayer } from '../../deck/deck';
import { makeCardId, makePlayerId } from '../../primitives/id';
import { createOrderedStack } from '../../primitives/ordered-stack';
import handleTapPermanentForMana from './tap-permanent-for-mana';

const basicLands = [
  { name: 'Plains', definition: plains, manaColor: 'W' as ManaColor },
  { name: 'Island', definition: island, manaColor: 'U' as ManaColor },
  { name: 'Swamp', definition: swamp, manaColor: 'B' as ManaColor },
  { name: 'Mountain', definition: mountain, manaColor: 'R' as ManaColor },
  { name: 'Forest', definition: forest, manaColor: 'G' as ManaColor },
];

describe('tap-permanent-for-mana', () => {
  describe('handleTapPermanentForMana', () => {
    it('taps permanent', () => {
      const playerId = makePlayerId();

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        mountain,
        'battlefield',
      );

      handleTapPermanentForMana(ctx, {
        type: 'TAP_PERMANENT_FOR_MANA',
        playerId,
        cardId,
      });

      expect(ctx.state.cards[cardId].tapped).toBe(true);
    });

    it.each(basicLands)(
      'adds $manaColor mana for $name',
      ({ definition, manaColor }) => {
        const playerId = makePlayerId();

        const { ctx, cardId } = createContextWithCardInZone(
          playerId,
          definition,
          'battlefield',
        );

        handleTapPermanentForMana(ctx, {
          type: 'TAP_PERMANENT_FOR_MANA',
          playerId,
          cardId,
        });

        expect(ctx.state.players[playerId].manaPool[manaColor]).toBe(1);
      },
    );

    it('resets priority passes (rule 117.3c)', () => {
      const playerId = makePlayerId();

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        mountain,
        'battlefield',
      );
      ctx.state.playersWhoPassedPriority = new Set([playerId]);

      handleTapPermanentForMana(ctx, {
        type: 'TAP_PERMANENT_FOR_MANA',
        playerId,
        cardId,
      });

      expect(ctx.state.playersWhoPassedPriority.size).toBe(0);
    });

    it.each(basicLands)(
      'emits MANA_ADDED event for $name',
      ({ definition, manaColor }) => {
        const playerId = makePlayerId();

        const { ctx, cardId } = createContextWithCardInZone(
          playerId,
          definition,
          'battlefield',
        );

        handleTapPermanentForMana(ctx, {
          type: 'TAP_PERMANENT_FOR_MANA',
          playerId,
          cardId,
        });

        expect(ctx.events.some((e) => e.type === 'MANA_ADDED')).toBe(true);
        const manaEvent = ctx.events.find((e) => e.type === 'MANA_ADDED');
        expect(manaEvent).toMatchObject({
          type: 'MANA_ADDED',
          playerId,
          color: manaColor,
          amount: 1,
        });
      },
    );

    it('throws error when card not found', () => {
      const playerId = makePlayerId();
      const cardId = makeCardId();
      const ctx = createTestContext();

      expect(() => {
        handleTapPermanentForMana(ctx, {
          type: 'TAP_PERMANENT_FOR_MANA',
          playerId,
          cardId,
        });
      }).toThrow('Card not found');
    });

    it('throws error when permanent not controlled by player', () => {
      const playerId = makePlayerId();
      const otherPlayerId = makePlayerId();

      const ctx = createTestContext({
        playerId: otherPlayerId,
        overrides: {
          players: {
            [playerId]: createTestPlayer(playerId),
            [otherPlayerId]: createTestPlayer(otherPlayerId),
          },
        },
      });

      let state = ctx.state;
      state = registerCardForPlayer(state, otherPlayerId, mountain, 1);
      const cardId = Array.from(state.players[otherPlayerId].library)[0];
      state = {
        ...state,
        players: {
          ...state.players,
          [otherPlayerId]: {
            ...state.players[otherPlayerId],
            battlefield: [cardId],
            library: createOrderedStack(),
          },
        },
      };
      ctx.state = state;

      expect(() => {
        handleTapPermanentForMana(ctx, {
          type: 'TAP_PERMANENT_FOR_MANA',
          playerId,
          cardId,
        });
      }).toThrow('Cannot tap a permanent you do not control');
    });

    it('throws error when permanent already tapped', () => {
      const playerId = makePlayerId();

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
      ctx.state = state;

      expect(() => {
        handleTapPermanentForMana(ctx, {
          type: 'TAP_PERMANENT_FOR_MANA',
          playerId,
          cardId,
        });
      }).toThrow('Permanent is already tapped');
    });

    it('throws error when permanent not on battlefield', () => {
      const playerId = makePlayerId();

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
            hand: [cardId],
            battlefield: [],
            library: createOrderedStack(),
          },
        },
      };
      ctx.state = state;

      expect(() => {
        handleTapPermanentForMana(ctx, {
          type: 'TAP_PERMANENT_FOR_MANA',
          playerId,
          cardId,
        });
      }).toThrow('Permanent is not on the battlefield');
    });
  });
});
