import { Id, makeId } from '../id/id';
import { ManaCost } from '../costs/mana-costs';
import { GameEvent, ReduceContext } from '../state/reducer';

type CardType =
  | 'artifact'
  | 'battle'
  | 'conspiracy'
  | 'creature'
  | 'dungeon'
  | 'enchantment'
  | 'instant'
  | 'kindred'
  | 'land'
  | 'phenomenon'
  | 'plane'
  | 'planeswalker'
  | 'scheme'
  | 'sorcery'
  | 'vanguard';

export interface CardDefinition {
  id: Id;
  scryfallId: string; // This defines which version of the card we're using

  // Metadata
  name: string;
  type: CardType;

  // Functionality
  manaCost: ManaCost;
  abilities: CardAbility[];
}

export type AbilityEffect = (ctx: ReduceContext) => void;

export type AbilityCost =
  | { kind: 'MANA'; manaCost: ManaCost }
  | { kind: 'TAP_SOURCE' }
  | { kind: 'PAY_LIFE'; amount: number }
  | { kind: 'SACRIFICE_PERMANENT'; description: string };

export type TargetValidator = (input: {
  ctx: ReduceContext;
  candidateId: Id;
}) => boolean;

export interface AbilityTarget {
  id: string;
  description: string;
  minTargets: number;
  maxTargets: number;
  validate: TargetValidator;
}

export type AbilityTargetBuilder = (ctx: ReduceContext) => AbilityTarget[];

export interface SpellMode {
  id: string;
  text: string;
  effect: AbilityEffect;
}

export interface ContinuousEffect {
  description: string;
  apply(ctx: ReduceContext): ReduceContext;
}

export interface TriggerCondition {
  id: Id;
  description: string;
  matches(event: GameEvent, ctx: ReduceContext, sourceId: Id): boolean;
}

interface CardAbilityBase {
  id: Id;
  text: string;
}

export interface SpellAbility extends CardAbilityBase {
  type: 'spell';
  effect: AbilityEffect;
  additionalCosts?: AbilityCost[];
  targets?: AbilityTargetBuilder;
  modes?: SpellMode[];
}

export type TimingRestriction = 'ANYTIME' | 'SORCERY_SPEED';

export interface ActivatedAbility extends CardAbilityBase {
  type: 'activated';
  cost: AbilityCost[];
  effect: AbilityEffect;
  timing?: TimingRestriction;
}

export interface TriggeredAbility extends CardAbilityBase {
  type: 'triggered';
  trigger: TriggerCondition;
  effect: AbilityEffect;
}

export interface StaticAbility extends CardAbilityBase {
  type: 'static';
  effect: (ctx: ReduceContext, sourceId: Id) => ContinuousEffect;
}

export type CardAbility =
  | SpellAbility
  | TriggeredAbility
  | StaticAbility
  | ActivatedAbility;

export type CardAbilityInput =
  | Omit<SpellAbility, 'id'>
  | (Omit<TriggeredAbility, 'id' | 'trigger'> & {
      trigger: Omit<TriggerCondition, 'id'>;
    })
  | Omit<StaticAbility, 'id'>
  | Omit<ActivatedAbility, 'id'>;

export type CardDefinitionInput = Omit<CardDefinition, 'id' | 'abilities'> & {
  abilities: CardAbilityInput[];
};

export function defineCard(input: CardDefinitionInput): CardDefinition {
  return {
    id: makeId('card'),
    ...input,
    abilities: input.abilities.map(createAbility),
  };
}

function createAbility(ability: CardAbilityInput): CardAbility {
  const id = makeId('ability');
  switch (ability.type) {
    case 'triggered':
      return {
        ...ability,
        id,
        trigger: {
          ...ability.trigger,
          id: makeId('trigger'),
        },
      };
    case 'spell':
    case 'static':
    case 'activated':
      return { ...ability, id };
  }
}
