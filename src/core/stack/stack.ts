import { Id } from '../id/id';
import { ReduceContext } from '../state/reducer';

type StackObjectType = 'SPELL' | 'ABILITY';

export interface StackObject {
  id: Id;
  controllerId: Id;
  type: StackObjectType;
  sourceCardId?: Id;
  effect: (ctx: ReduceContext) => void;
  targets: Id[];
}
