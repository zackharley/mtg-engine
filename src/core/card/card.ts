import type { ManaCost } from '../costs/mana-costs';
import type {
  CardDefinitionId,
  CardId,
  PlayerId,
  TargetId,
} from '../primitives/id';
import { makeCardDefinitionId } from '../primitives/id';
import type { GameEvent, ReduceContext } from '../state/reducer';

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
  id: CardDefinitionId;
  scryfallId: string; // This defines which version of the card we're using

  // Metadata
  name: string;
  type: CardType;

  // Functionality
  manaCost: ManaCost;
  abilities: CardAbility[];
}

export interface AbilityEffectArgs {
  sourceId: CardId;
  controllerId: PlayerId;
  targets: TargetId[];
}

export type AbilityEffect = (
  ctx: ReduceContext,
  args: AbilityEffectArgs,
) => void;

export type AbilityCost =
  | { kind: 'MANA'; manaCost: ManaCost }
  | { kind: 'TAP_SOURCE' }
  | { kind: 'PAY_LIFE'; amount: number }
  | { kind: 'SACRIFICE_PERMANENT'; description: string };

export type TargetValidator = (input: {
  ctx: ReduceContext;
  candidateId: TargetId;
}) => boolean;

export interface AbilityTarget {
  // id: string;
  description: string;
  minTargets: number;
  maxTargets: number;
  validate: TargetValidator;
}

export type AbilityTargetBuilder = (ctx: ReduceContext) => AbilityTarget[];

export interface SpellMode {
  // id: string;
  text: string;
  effect: AbilityEffect;
}

export interface ContinuousEffect {
  description: string;
  apply(ctx: ReduceContext): ReduceContext;
}

export interface TriggerCondition {
  // id: Id;
  description: string;
  matches(event: GameEvent, ctx: ReduceContext, sourceId: CardId): boolean;
}

interface CardAbilityBase {
  // id: Id;
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
  /**
   * Whether this ability produces mana (rule 605.1a).
   * An activated ability is a mana ability if it doesn't require a target,
   * could add mana to a player's mana pool when it resolves, and is not a loyalty ability.
   */
  producesMana?: boolean;
}

export interface TriggeredAbility extends CardAbilityBase {
  type: 'triggered';
  trigger: TriggerCondition;
  effect: AbilityEffect;
  /**
   * Whether this ability produces mana (rule 605.1b).
   * A triggered ability is a mana ability if it doesn't require a target,
   * triggers from mana abilities/mana being added, and could add mana when it resolves.
   */
  producesMana?: boolean;
}

export interface StaticAbility extends CardAbilityBase {
  type: 'static';
  effect: (ctx: ReduceContext, sourceId: CardId) => ContinuousEffect;
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

export interface Card {
  id: CardId;
  definitionId: CardDefinitionId;
  controllerId: PlayerId;
  tapped?: boolean;
}

export function defineCard(input: CardDefinitionInput): CardDefinition {
  return {
    id: makeCardDefinitionId(),
    ...input,
    abilities: input.abilities.map(createAbility),
  };
}

function createAbility(ability: CardAbilityInput): CardAbility {
  switch (ability.type) {
    case 'triggered':
      return {
        ...ability,
        trigger: {
          ...ability.trigger,
        },
      };
    case 'spell':
    case 'static':
    case 'activated':
      return { ...ability };
  }
}
