import {
  cardIsInZone,
  createStateWithCardInZone,
  createTestCard,
  createTestContext,
} from '@/__tests__/test-utils';

import { makeCardId, makePlayerId } from '../primitives/id';
import { addCardToZone, moveCard, removeCardFromZone } from './move-card';

describe('move-card', () => {
  describe('moveCard', () => {
    it.each([
      ['hand', 'battlefield'],
      ['library', 'hand'],
      ['battlefield', 'graveyard'],
    ] as const)('moves card from %s to %s', (fromZone, toZone) => {
      const playerId = makePlayerId();
      const cardId = makeCardId();
      const state = createStateWithCardInZone(cardId, playerId, fromZone);

      const result = moveCard(state, cardId, fromZone, toZone);

      expect(cardIsInZone(result, cardId, playerId, fromZone)).toBe(false);
      expect(cardIsInZone(result, cardId, playerId, toZone)).toBe(true);
    });

    it('returns new state object (immutability)', () => {
      const playerId = makePlayerId();
      const cardId = makeCardId();
      const state = createStateWithCardInZone(cardId, playerId, 'hand');

      const result = moveCard(state, cardId, 'hand', 'battlefield');

      expect(result).not.toBe(state);
      expect(result.players).not.toBe(state.players);
    });

    it('throws error when card not found', () => {
      const cardId = makeCardId();
      const ctx = createTestContext();

      expect(() => {
        moveCard(ctx.state, cardId, 'hand', 'battlefield');
      }).toThrow(`Card ${cardId} not found`);
    });
  });

  describe('addCardToZone', () => {
    it.each([['hand'], ['battlefield'], ['graveyard'], ['library']] as const)(
      'adds card to %s',
      (zone) => {
        const playerId = makePlayerId();
        const cardId = makeCardId();
        const ctx = createTestContext({
          overrides: {
            cards: {
              [cardId]: createTestCard(cardId, playerId),
            },
          },
          playerId,
        });

        const result = addCardToZone(ctx.state, cardId, zone);

        expect(cardIsInZone(result, cardId, playerId, zone)).toBe(true);
      },
    );
  });

  describe('removeCardFromZone', () => {
    it.each([['hand'], ['battlefield'], ['graveyard'], ['library']] as const)(
      'removes card from %s',
      (zone) => {
        const playerId = makePlayerId();
        const cardId = makeCardId();
        const state = createStateWithCardInZone(cardId, playerId, zone);

        const result = removeCardFromZone(state, cardId, zone);

        expect(cardIsInZone(result, cardId, playerId, zone)).toBe(false);
      },
    );
  });
});
