import { Id, makeId } from '../id/id';
import { ManaCost } from '../costs/mana-costs';
import { StackObject } from '../stack/stack';
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

type CardAbilityType = 'spell' | 'triggered' | 'static' | 'activated';
interface CardAbility {
  id: Id;
  type: CardAbilityType;
}

interface TriggerDefinition {
  id: Id;
  matches(event: GameEvent, ctx: ReduceContext, sourceId: Id): boolean;
  createStackObject(
    event: GameEvent,
    ctx: ReduceContext,
    sourceId: Id,
  ): StackObject;
}

type CardDefinitionInput = Omit<CardDefinition, 'id'>;
export function defineCard(input: CardDefinitionInput): CardDefinition {
  return {
    id: makeId('card'),
    ...input,
  };
}
