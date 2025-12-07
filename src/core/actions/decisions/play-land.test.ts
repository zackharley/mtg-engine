import {
  createContextWithCardInHand,
  createStateWithCardInHand,
  createTestContext,
} from '@/__tests__/test-utils';

import { defineCard } from '../../card/card';
import { parseManaCost } from '../../costs/mana-costs';
import { makePlayerId } from '../../primitives/id';
import type { AvailablePlayerDecision } from '../../state/reducer';
import { addPlayLandDecisions } from './play-land';

describe('play-land decisions', () => {
  describe('addPlayLandDecisions', () => {
    it('adds PLAY_LAND decision for land cards in hand', () => {
      const playerId = makePlayerId();
      const testLand = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });
      const { ctx, cardId } = createContextWithCardInHand(playerId, testLand);

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addPlayLandDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(1);
      expect(decisions[0]).toEqual({ type: 'PLAY_LAND', cardId });
    });

    it('does not add PLAY_LAND when land play limit reached', () => {
      const playerId = makePlayerId();
      const testLand = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const { ctx } = createContextWithCardInHand(playerId, testLand);
      const state = ctx.state;
      state.turn.landPlayedThisTurn = 1;

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addPlayLandDecisions(state, playerId, initialDecisions);

      expect(decisions).toHaveLength(0);
    });

    it('does not add PLAY_LAND for non-active player', () => {
      const activePlayerId = makePlayerId();
      const otherPlayerId = makePlayerId();
      const testLand = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const { ctx } = createContextWithCardInHand(otherPlayerId, testLand);
      const state = ctx.state;
      state.turn.activePlayerId = activePlayerId;

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addPlayLandDecisions(
        state,
        otherPlayerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(0);
    });

    it('adds multiple PLAY_LAND decisions for multiple land cards', () => {
      const playerId = makePlayerId();
      const testLand = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testLand,
        2,
      );

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addPlayLandDecisions(state, playerId, initialDecisions);

      expect(decisions).toHaveLength(2);
      expect(decisions[0]).toEqual({ type: 'PLAY_LAND', cardId: cardIds[0] });
      expect(decisions[1]).toEqual({ type: 'PLAY_LAND', cardId: cardIds[1] });
    });

    it('does not add PLAY_LAND for non-land cards', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [],
      });

      const { state } = createStateWithCardInHand(playerId, testCard, 1);

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addPlayLandDecisions(state, playerId, initialDecisions);

      expect(decisions).toHaveLength(0);
    });

    it('returns decisions unchanged when player not found', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {},
        },
      });

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addPlayLandDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toBe(initialDecisions);
      expect(decisions).toHaveLength(0);
    });

    it('preserves existing decisions and adds new ones', () => {
      const playerId = makePlayerId();
      const testLand = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const { ctx, cardId } = createContextWithCardInHand(playerId, testLand);

      const existingDecision = { type: 'PASS_PRIORITY' as const };
      const initialDecisions = [existingDecision];
      const decisions = addPlayLandDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(2);
      expect(decisions[0]).toEqual(existingDecision);
      expect(decisions[1]).toEqual({ type: 'PLAY_LAND', cardId });
    });

    it('does not mutate the original decisions array', () => {
      const playerId = makePlayerId();
      const testLand = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const { state } = createStateWithCardInHand(playerId, testLand);

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addPlayLandDecisions(state, playerId, initialDecisions);

      expect(decisions).not.toBe(initialDecisions);
      expect(initialDecisions).toHaveLength(0);
      expect(decisions).toHaveLength(1);
    });
  });
});
