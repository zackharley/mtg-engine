import {
  createContextWithCardInZone,
  createTestContext,
} from '@/__tests__/test-utils';
import mountain from '@/card-definitions/mountain/card';

import { makeCardId, makePlayerId } from '../../primitives/id';
import handlePlayLand from './play-land';

describe('play-land', () => {
  describe('handlePlayLand', () => {
    it('moves land to battlefield', () => {
      const playerId = makePlayerId();

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        mountain,
        'hand',
      );

      handlePlayLand(ctx, { type: 'PLAY_LAND', playerId, cardId });

      expect(ctx.state.players[playerId].battlefield).toContain(cardId);
      expect(ctx.state.players[playerId].hand).not.toContain(cardId);
    });

    it('enforces land play limit (rule 305.3)', () => {
      const playerId = makePlayerId();

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        mountain,
        'hand',
      );
      ctx.state.turn.landPlayedThisTurn = 1;

      expect(() => {
        handlePlayLand(ctx, { type: 'PLAY_LAND', playerId, cardId });
      }).toThrow('already played');
    });

    it('increments land play counter', () => {
      const playerId = makePlayerId();

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        mountain,
        'hand',
      );
      ctx.state.turn.landPlayedThisTurn = 0;

      handlePlayLand(ctx, { type: 'PLAY_LAND', playerId, cardId });

      expect(ctx.state.turn.landPlayedThisTurn).toBe(1);
    });

    it('resets priority passes (rule 117.3c)', () => {
      const playerId = makePlayerId();

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        mountain,
        'hand',
      );
      ctx.state.playersWhoPassedPriority = new Set([playerId]);

      handlePlayLand(ctx, { type: 'PLAY_LAND', playerId, cardId });
      expect(ctx.state.playersWhoPassedPriority.size).toBe(0);
    });

    it('emits CARD_MOVED event', () => {
      const playerId = makePlayerId();

      const { ctx, cardId } = createContextWithCardInZone(
        playerId,
        mountain,
        'hand',
      );

      handlePlayLand(ctx, { type: 'PLAY_LAND', playerId, cardId });

      expect(ctx.events.some((e) => e.type === 'CARD_MOVED')).toBe(true);
      const movedEvent = ctx.events.find((e) => e.type === 'CARD_MOVED');
      expect(movedEvent).toMatchObject({
        type: 'CARD_MOVED',
        cardId,
        from: 'hand',
        to: 'battlefield',
      });
    });

    it('throws error when land not in hand', () => {
      const playerId = makePlayerId();
      const cardId = makeCardId();
      const ctx = createTestContext({ playerId });

      expect(() => {
        handlePlayLand(ctx, { type: 'PLAY_LAND', playerId, cardId });
      }).toThrow('Land is not in hand');
    });

    it('throws error when player not found', () => {
      const playerId = makePlayerId();
      const cardId = makeCardId();
      const ctx = createTestContext({
        overrides: {
          players: {},
        },
      });

      expect(() => {
        handlePlayLand(ctx, { type: 'PLAY_LAND', playerId, cardId });
      }).toThrow('Player not found');
    });
  });
});
