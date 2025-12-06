import { defineCard } from './card';
import { parseManaCost } from '../costs/mana-costs';
import type { ReduceContext } from '../state/reducer';

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
    expect(card.abilities[0].id).toMatch(/^ability-/);
    if (card.abilities[0].type === 'spell') {
      expect(typeof card.abilities[0].targets).toBe('function');
      const dummyCtx = {
        state: {} as any,
        events: [],
        emit: () => undefined,
      } as ReduceContext;
      const targets = card.abilities[0].targets?.(dummyCtx);
      expect(targets?.[0].validate).toBeDefined();
    }
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
    if (ability.type === 'triggered') {
      expect(ability.trigger.id).toMatch(/^trigger-/);
    } else {
      throw new Error('expected triggered ability');
    }
  });
});
