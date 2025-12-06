import { CardId, PlayerId, StackObjectId, TargetId } from '../primitives/id';
import { ReduceContext } from '../state/reducer';
import { OrderedStack } from '../primitives/ordered-stack';

type StackObjectType = 'SPELL' | 'ABILITY' | 'ENGINE';

export interface StackObject {
  id: StackObjectId;
  controllerId: PlayerId;
  type: StackObjectType;
  sourceCardId?: CardId;
  effect: (ctx: ReduceContext) => void;
  targets: TargetId[];
}

/**
 * Immutable stack primitive for MTG stack objects.
 * Built on top of the generic OrderedStack primitive.
 */
export type Stack = OrderedStack<StackObject>;
