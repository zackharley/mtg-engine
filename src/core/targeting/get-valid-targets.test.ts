import {
  createContextWithCardInHand,
  createTestContext,
} from '@/__tests__/test-utils';
import lightningBolt from '@/card-definitions/cards/lightning-bolt/card';
import { defineCard } from '@/core/card/card';
import { parseManaCost } from '@/core/costs/mana-costs';
import type { CardId, PlayerId, TargetId } from '@/core/primitives/id';
import {
  makeCardDefinitionId,
  makeCardId,
  makePlayerId,
} from '@/core/primitives/id';

import type { ReduceContext } from '../state/reducer';
import { getValidTargets } from './get-valid-targets';

describe('getValidTargets', () => {
  describe('with Lightning Bolt', () => {
    it('returns all players as valid targets', () => {
      const playerId = makePlayerId();
      const { ctx } = createContextWithCardInHand(playerId, lightningBolt);

      const spellAbility = lightningBolt.abilities.find(
        (a): a is typeof a & { type: 'spell' } => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (!spellAbility || spellAbility.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      const validTargets = getValidTargets(ctx.state, spellAbility, playerId);

      // Should include all players (at least 2 from createTestContext)
      const playerIds = Object.keys(ctx.state.players);
      expect(validTargets.length).toBeGreaterThanOrEqual(2);
      expect(validTargets).toEqual(expect.arrayContaining(playerIds));
    });

    it('returns empty array when no players exist', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {},
        },
      });

      const spellAbility = lightningBolt.abilities.find(
        (a): a is typeof a & { type: 'spell' } => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (!spellAbility || spellAbility.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      const validTargets = getValidTargets(ctx.state, spellAbility, playerId);

      expect(validTargets).toEqual([]);
    });
  });

  describe('with spells without targeting requirements', () => {
    it('returns empty array', () => {
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

      const { ctx } = createContextWithCardInHand(
        playerId,
        spellWithoutTargets,
      );

      const spellAbility = spellWithoutTargets.abilities.find(
        (a) => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (spellAbility?.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      const validTargets = getValidTargets(ctx.state, spellAbility, playerId);

      expect(validTargets).toEqual([]);
    });
  });

  describe('with spells requiring multiple targets', () => {
    it('returns valid targets when multiple are required', () => {
      const playerId = makePlayerId();
      const multiTargetSpell = defineCard({
        scryfallId: 'test-multi',
        name: 'Multi Target Spell',
        type: 'instant',
        manaCost: parseManaCost('{1}'),
        abilities: [
          {
            type: 'spell',
            text: 'Target two things',
            effect: jest.fn(),
            targets: () => [
              {
                description: 'Any target',
                minTargets: 2,
                maxTargets: 2,
                validate: () => true,
              },
            ],
          },
        ],
      });

      const { ctx } = createContextWithCardInHand(playerId, multiTargetSpell);

      const spellAbility = multiTargetSpell.abilities.find(
        (a) => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (spellAbility?.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      const validTargets = getValidTargets(ctx.state, spellAbility, playerId);

      // Should have at least 2 targets (players)
      expect(validTargets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('with spells with restrictive validation', () => {
    it('filters targets based on validate function', () => {
      const playerId = makePlayerId();
      const restrictiveSpell = defineCard({
        scryfallId: 'test-restrictive',
        name: 'Restrictive Spell',
        type: 'instant',
        manaCost: parseManaCost('{1}'),
        abilities: [
          {
            type: 'spell',
            text: 'Target specific player',
            effect: jest.fn(),
            targets: () => [
              {
                description: 'Specific player',
                minTargets: 1,
                maxTargets: 1,
                validate: ({ candidateId }) => {
                  // Only allow targeting a specific player (not the caster)
                  return candidateId !== playerId;
                },
              },
            ],
          },
        ],
      });

      const { ctx } = createContextWithCardInHand(playerId, restrictiveSpell);

      const spellAbility = restrictiveSpell.abilities.find(
        (a) => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (spellAbility?.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      const validTargets = getValidTargets(ctx.state, spellAbility, playerId);

      // Should not include the caster
      expect(validTargets).not.toContain(playerId);
      // Should include other players
      const otherPlayers = Object.keys(ctx.state.players).filter(
        (id) => id !== playerId,
      );
      expect(validTargets).toEqual(expect.arrayContaining(otherPlayers));
    });
  });

  describe('with permanents on battlefield', () => {
    it('includes permanents as valid targets', () => {
      const playerId = makePlayerId();
      const permanentSpell = defineCard({
        scryfallId: 'test-permanent',
        name: 'Permanent Spell',
        type: 'instant',
        manaCost: parseManaCost('{1}'),
        abilities: [
          {
            type: 'spell',
            text: 'Target permanent',
            effect: jest.fn(),
            targets: () => [
              {
                description: 'Any permanent',
                minTargets: 1,
                maxTargets: 1,
                validate: ({
                  candidateId,
                  ctx,
                }: {
                  candidateId: TargetId;
                  ctx: ReduceContext;
                }) => {
                  // Check if it's a permanent on battlefield
                  return Object.values(ctx.state.players).some((player) =>
                    player.battlefield.includes(candidateId as CardId),
                  );
                },
              },
            ],
          },
        ],
      });

      const ctx = createTestContext({
        playerId,
        numPlayers: 2,
      });

      // Get the opponent's ID (first player that's not the caster)
      const playerIds = Object.keys(ctx.state.players) as PlayerId[];
      const opponentId = playerIds.find((id) => id !== playerId);
      expect(opponentId).toBeDefined();
      if (!opponentId) {
        throw new Error('Opponent not found');
      }

      // Add a permanent to opponent's battlefield
      const permanentCardId = makeCardId();
      ctx.state.cards[permanentCardId] = {
        id: permanentCardId,
        definitionId: makeCardDefinitionId(),
        controllerId: opponentId,
      };
      ctx.state.players[opponentId].battlefield.push(permanentCardId);

      const spellAbility = permanentSpell.abilities.find(
        (a): a is typeof a & { type: 'spell' } => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (!spellAbility || spellAbility.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      const validTargets = getValidTargets(ctx.state, spellAbility, playerId);

      // Should include the permanent
      expect(validTargets).toContain(permanentCardId);
    });
  });
});
