import {
  createContextWithCardInHand,
  createTestContext,
} from '@/__tests__/test-utils';
import lightningBolt from '@/card-definitions/lightning-bolt/card';
import { defineCard } from '@/core/card/card';
import { parseManaCost } from '@/core/costs/mana-costs';
import { makePlayerId, type TargetId } from '@/core/primitives/id';

import { validateTargets } from './validate-targets';

describe('validateTargets', () => {
  describe('with Lightning Bolt', () => {
    it('does not throw when valid target is provided', () => {
      const playerId = makePlayerId();
      const { ctx } = createContextWithCardInHand(playerId, lightningBolt);

      const spellAbility = lightningBolt.abilities.find(
        (a): a is typeof a & { type: 'spell' } => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (!spellAbility || spellAbility.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      const targetId = Object.keys(ctx.state.players)[0] as TargetId;

      expect(() => {
        validateTargets(ctx.state, spellAbility, [targetId], playerId);
      }).not.toThrow();
    });

    it('throws error when no targets provided but required', () => {
      const playerId = makePlayerId();
      const { ctx } = createContextWithCardInHand(playerId, lightningBolt);

      const spellAbility = lightningBolt.abilities.find(
        (a): a is typeof a & { type: 'spell' } => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (!spellAbility || spellAbility.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      expect(() => {
        validateTargets(ctx.state, spellAbility, [], playerId);
      }).toThrow(/requires.*target/i);
    });

    it('throws error when too many targets provided', () => {
      const playerId = makePlayerId();
      const { ctx } = createContextWithCardInHand(playerId, lightningBolt);

      const spellAbility = lightningBolt.abilities.find(
        (a): a is typeof a & { type: 'spell' } => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (!spellAbility || spellAbility.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      const playerIds = Object.keys(ctx.state.players) as TargetId[];

      expect(() => {
        validateTargets(
          ctx.state,
          spellAbility,
          [playerIds[0], playerIds[1]],
          playerId,
        );
      }).toThrow(/requires.*1.*target/i);
    });

    it('throws error when invalid target provided', () => {
      const playerId = makePlayerId();
      const { ctx } = createContextWithCardInHand(playerId, lightningBolt);

      const spellAbility = lightningBolt.abilities.find(
        (a): a is typeof a & { type: 'spell' } => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (!spellAbility || spellAbility.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      const invalidTarget = 'invalid-target-id' as TargetId;

      expect(() => {
        validateTargets(ctx.state, spellAbility, [invalidTarget], playerId);
      }).toThrow(/invalid.*target/i);
    });

    it('throws error when duplicate targets provided', () => {
      const playerId = makePlayerId();
      const { ctx } = createContextWithCardInHand(playerId, lightningBolt);

      const spellAbility = lightningBolt.abilities.find(
        (a): a is typeof a & { type: 'spell' } => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (!spellAbility || spellAbility.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      const targetId = Object.keys(ctx.state.players)[0] as TargetId;

      expect(() => {
        validateTargets(
          ctx.state,
          spellAbility,
          [targetId, targetId],
          playerId,
        );
      }).toThrow(/duplicate.*target/i);
    });
  });

  describe('with spells without targeting requirements', () => {
    it('does not throw when empty targets provided', () => {
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

      expect(() => {
        validateTargets(ctx.state, spellAbility, [], playerId);
      }).not.toThrow();
    });
  });

  describe('with spells requiring multiple targets', () => {
    it('does not throw when correct number of targets provided', () => {
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

      const ctx = createTestContext({ playerId, numPlayers: 3 });
      const playerIds = Object.keys(ctx.state.players) as TargetId[];

      const spellAbility = multiTargetSpell.abilities.find(
        (a) => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (spellAbility?.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      expect(() => {
        validateTargets(
          ctx.state,
          spellAbility,
          [playerIds[0], playerIds[1]],
          playerId,
        );
      }).not.toThrow();
    });

    it('throws error when too few targets provided', () => {
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

      const ctx = createTestContext({ playerId });
      const playerIds = Object.keys(ctx.state.players) as TargetId[];

      const spellAbility = multiTargetSpell.abilities.find(
        (a) => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (spellAbility?.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      expect(() => {
        validateTargets(ctx.state, spellAbility, [playerIds[0]], playerId);
      }).toThrow(/requires.*2.*target/i);
    });
  });

  describe('with optional targeting (minTargets: 0)', () => {
    it('does not throw when zero targets provided', () => {
      const playerId = makePlayerId();
      const optionalTargetSpell = defineCard({
        scryfallId: 'test-optional',
        name: 'Optional Target Spell',
        type: 'instant',
        manaCost: parseManaCost('{1}'),
        abilities: [
          {
            type: 'spell',
            text: 'May target something',
            effect: jest.fn(),
            targets: () => [
              {
                description: 'Optional target',
                minTargets: 0,
                maxTargets: 1,
                validate: () => true,
              },
            ],
          },
        ],
      });

      const { ctx } = createContextWithCardInHand(
        playerId,
        optionalTargetSpell,
      );

      const spellAbility = optionalTargetSpell.abilities.find(
        (a) => a.type === 'spell',
      );
      expect(spellAbility).toBeDefined();
      if (spellAbility?.type !== 'spell') {
        throw new Error('Spell ability not found');
      }

      expect(() => {
        validateTargets(ctx.state, spellAbility, [], playerId);
      }).not.toThrow();
    });
  });
});
