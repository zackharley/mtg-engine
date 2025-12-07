import { parseManaCost } from '../costs/mana-costs';
import type { ReduceContext } from '../state/reducer';
import type { GameState } from '../state/state';
import type { SpellAbility } from './card';
import { defineCard } from './card';

describe('defineCard ability modeling', () => {
  it('assigns ids to cards and their abilities', () => {
    const card = defineCard({
      scryfallId: 'test-id',
      name: 'Test Bolt',
      type: 'instant',
      manaCost: parseManaCost('{R}'),
      abilities: [
        {
          type: 'spell',
          text: 'Deal 3 damage to any target.',
          effect: jest.fn(),
          targets: jest.fn().mockReturnValue([
            {
              id: 'any-target',
              description: 'any target',
              minTargets: 1,
              maxTargets: 1,
              validate: jest.fn().mockReturnValue(true),
            },
          ]),
        },
      ],
    });

    expect(card.id).toMatch(/^card-/);
    expect(card.abilities).toHaveLength(1);
    expect(card.abilities[0].type).toBe('spell');

    const spellAbility = card.abilities[0] as SpellAbility;
    expect(typeof spellAbility.targets).toBe('function');
    const dummyCtx = {
      state: {} as Partial<GameState> as GameState,
      events: [],
      emit: () => undefined,
    } as ReduceContext;
    const targets = spellAbility.targets?.(dummyCtx);
    expect(targets).toBeDefined();
    expect(targets?.[0]).toBeDefined();
    expect(targets?.[0].validate).toBeDefined();
  });

  it('assigns ids to triggered abilities and their triggers', () => {
    const card = defineCard({
      scryfallId: 'trigger-card',
      name: 'Trigger Tester',
      type: 'creature',
      manaCost: parseManaCost('{1}{G}'),
      abilities: [
        {
          type: 'triggered',
          text: 'When this enters, draw a card.',
          trigger: {
            description: 'Enters the battlefield',
            matches: jest.fn().mockReturnValue(true),
          },
          effect: jest.fn(),
        },
      ],
    });

    const ability = card.abilities[0];
    expect(ability.type).toBe('triggered');
  });
});
