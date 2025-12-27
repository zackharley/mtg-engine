import { parseManaCost } from '../costs/mana-costs';
import {
  type ActivatedAbility,
  defineCard,
  type TriggeredAbility,
} from './card';
import {
  isActivatedManaAbility,
  isManaAbility,
  isTriggeredManaAbility,
} from './mana-ability';

describe('mana-ability', () => {
  describe('isActivatedManaAbility', () => {
    it('should return true for activated abilities with producesMana flag', () => {
      const ability = defineCard({
        scryfallId: 'test',
        name: 'Test',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: Add {G}.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: true,
            effect: jest.fn(),
          },
        ],
      }).abilities[0];

      expect(isActivatedManaAbility(ability as ActivatedAbility)).toBe(true);
    });

    it('should return false for activated abilities without producesMana flag', () => {
      const ability = defineCard({
        scryfallId: 'test',
        name: 'Test',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: You gain 1 life.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: false,
            effect: jest.fn(),
          },
        ],
      }).abilities[0];

      expect(isActivatedManaAbility(ability as ActivatedAbility)).toBe(false);
    });

    it('should return false when producesMana is undefined', () => {
      const ability = defineCard({
        scryfallId: 'test',
        name: 'Test',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: You gain 1 life.',
            cost: [{ kind: 'TAP_SOURCE' }],
            effect: jest.fn(),
          },
        ],
      }).abilities[0];

      expect(isActivatedManaAbility(ability as ActivatedAbility)).toBe(false);
    });
  });

  describe('isTriggeredManaAbility', () => {
    it('should return true for triggered abilities with producesMana flag', () => {
      const ability = defineCard({
        scryfallId: 'test',
        name: 'Test',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'triggered',
            text: 'Whenever you tap a land for mana, add one mana of any type.',
            producesMana: true,
            trigger: {
              description: 'test',
              matches: jest.fn(),
            },
            effect: jest.fn(),
          },
        ],
      }).abilities[0];

      expect(isTriggeredManaAbility(ability as TriggeredAbility)).toBe(true);
    });

    it('should return false for triggered abilities without producesMana flag', () => {
      const ability = defineCard({
        scryfallId: 'test',
        name: 'Test',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'triggered',
            text: 'When this enters the battlefield, you gain 1 life.',
            trigger: {
              description: 'test',
              matches: jest.fn(),
            },
            effect: jest.fn(),
          },
        ],
      }).abilities[0];

      expect(isTriggeredManaAbility(ability as TriggeredAbility)).toBe(false);
    });
  });

  describe('isManaAbility', () => {
    it('should return true for activated mana abilities', () => {
      const ability = defineCard({
        scryfallId: 'test',
        name: 'Test',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: Add {G}.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: true,
            effect: jest.fn(),
          },
        ],
      }).abilities[0];

      expect(isManaAbility(ability)).toBe(true);
    });

    it('should return true for triggered mana abilities', () => {
      const ability = defineCard({
        scryfallId: 'test',
        name: 'Test',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'triggered',
            text: 'Whenever you tap a land for mana, add one mana.',
            producesMana: true,
            trigger: {
              description: 'test',
              matches: jest.fn(),
            },
            effect: jest.fn(),
          },
        ],
      }).abilities[0];

      expect(isManaAbility(ability)).toBe(true);
    });

    it('should return false for spell abilities', () => {
      const ability = defineCard({
        scryfallId: 'test',
        name: 'Test',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [
          {
            type: 'spell',
            text: 'Deal 3 damage',
            effect: jest.fn(),
          },
        ],
      }).abilities[0];

      expect(isManaAbility(ability)).toBe(false);
    });

    it('should return false for static abilities', () => {
      const ability = defineCard({
        scryfallId: 'test',
        name: 'Test',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'static',
            text: 'Creatures you control get +1/+1.',
            effect: jest.fn(),
          },
        ],
      }).abilities[0];

      expect(isManaAbility(ability)).toBe(false);
    });

    it('should return false for non-mana activated abilities', () => {
      const ability = defineCard({
        scryfallId: 'test',
        name: 'Test',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: You gain 1 life.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: false,
            effect: jest.fn(),
          },
        ],
      }).abilities[0];

      expect(isManaAbility(ability)).toBe(false);
    });
  });
});
