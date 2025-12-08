import {
  createStateWithCardInHand,
  createTestContext,
} from '@/__tests__/test-utils';
import lightningBolt from '@/card-definitions/lightning-bolt/card';

import { defineCard } from '../../card/card';
import { parseManaCost } from '../../costs/mana-costs';
import { makePlayerId } from '../../primitives/id';
import type {
  AvailablePlayerDecision,
  ReduceContext,
} from '../../state/reducer';
import { addCastSpellDecisions } from './cast-spell';

describe('cast-spell decisions', () => {
  describe('addCastSpellDecisions', () => {
    it('adds CAST_SPELL decision for spell cards in hand', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [
          {
            type: 'spell',
            text: 'Draw a card',
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addCastSpellDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(1);
      expect(decisions[0]).toEqual({
        type: 'CAST_SPELL',
        cardId,
        targets: [],
      });
    });

    it('adds multiple CAST_SPELL decisions for multiple spell cards', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [
          {
            type: 'spell',
            text: 'Draw a card',
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        2,
      );

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addCastSpellDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(2);
      expect(decisions[0]).toEqual({
        type: 'CAST_SPELL',
        cardId: cardIds[0],
        targets: [],
      });
      expect(decisions[1]).toEqual({
        type: 'CAST_SPELL',
        cardId: cardIds[1],
        targets: [],
      });
    });

    it('does not add CAST_SPELL for cards without spell abilities', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [], // No spell ability
      });

      const { state } = createStateWithCardInHand(playerId, testCard, 1);

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addCastSpellDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(0);
    });

    it('does not add CAST_SPELL for land cards', () => {
      const playerId = makePlayerId();
      const testLand = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [],
      });

      const { state } = createStateWithCardInHand(playerId, testLand, 1);

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addCastSpellDecisions(
        state,
        playerId,
        initialDecisions,
      );

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
      const decisions = addCastSpellDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toBe(initialDecisions);
      expect(decisions).toHaveLength(0);
    });

    it('preserves existing decisions and adds new ones', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [
          {
            type: 'spell',
            text: 'Draw a card',
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];

      const existingDecision = { type: 'PASS_PRIORITY' as const };
      const initialDecisions = [existingDecision];
      const decisions = addCastSpellDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(2);
      expect(decisions[0]).toEqual(existingDecision);
      expect(decisions[1]).toEqual({
        type: 'CAST_SPELL',
        cardId,
        targets: [],
      });
    });

    it('does not mutate the original decisions array', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [
          {
            type: 'spell',
            text: 'Draw a card',
            effect: jest.fn(),
          },
        ],
      });

      const { state } = createStateWithCardInHand(playerId, testCard, 1);

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addCastSpellDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).not.toBe(initialDecisions);
      expect(initialDecisions).toHaveLength(0);
      expect(decisions).toHaveLength(1);
    });

    it('adds CAST_SPELL decision for Lightning Bolt when valid targets exist', () => {
      const playerId = makePlayerId();
      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        lightningBolt,
        1,
      );
      const cardId = cardIds[0];

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addCastSpellDecisions(
        state,
        playerId,
        initialDecisions,
      );

      // Should add decision because Lightning Bolt has valid targets (other players)
      expect(decisions).toHaveLength(1);
      expect(decisions[0]).toEqual({
        type: 'CAST_SPELL',
        cardId,
        targets: [],
      });
    });

    it('does not add CAST_SPELL decision when no valid targets exist', () => {
      const playerId = makePlayerId();
      const restrictiveSpell = defineCard({
        scryfallId: 'test-restrictive',
        name: 'Restrictive Spell',
        type: 'instant',
        manaCost: parseManaCost('{1}'),
        abilities: [
          {
            type: 'spell',
            text: 'Target opponent',
            effect: jest.fn(),
            targets: () => [
              {
                description: 'Opponent only',
                minTargets: 1,
                maxTargets: 1,
                validate: ({
                  candidateId,
                }: {
                  candidateId: string;
                  ctx: ReduceContext;
                }) => {
                  // Only allow targeting opponents (not self)
                  return candidateId !== playerId;
                },
              },
            ],
          },
        ],
      });

      // Create state with only one player (no opponents)
      const ctx = createTestContext({
        playerId,
        numPlayers: 1,
      });
      const cardId = ctx.state.players[playerId].hand[0];
      ctx.state.cards[cardId] = {
        id: cardId,
        definitionId: restrictiveSpell.id,
        controllerId: playerId,
      };
      ctx.state.cardDefinitions[restrictiveSpell.id] = restrictiveSpell;
      ctx.state.players[playerId].hand = [cardId];

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addCastSpellDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(0);
    });

    it('adds CAST_SPELL decision for spells without targeting requirements', () => {
      const playerId = makePlayerId();
      const spellWithoutTargets = defineCard({
        scryfallId: 'test-spell',
        name: 'Test Spell',
        type: 'instant',
        manaCost: parseManaCost('{1}'),
        abilities: [
          {
            type: 'spell',
            text: 'Do something',
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        spellWithoutTargets,
        1,
      );
      const cardId = cardIds[0];

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addCastSpellDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(1);
      expect(decisions[0]).toEqual({
        type: 'CAST_SPELL',
        cardId,
        targets: [],
      });
    });
  });
});
