import { produce } from 'immer';
import {
  CardId,
  PlayerId,
  StackObjectId,
  TargetId,
  makeStackObjectId,
} from '../primitives/id';
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

/**
 * Test-only stack object that signals the engine loop to exit early.
 */
export function createKillSwitchStackObject(
  controllerId: PlayerId,
  reason = 'kill-switch-triggered',
): StackObject {
  return {
    id: makeStackObjectId(),
    controllerId,
    type: 'ENGINE',
    effect: (ctx: ReduceContext) => {
      ctx.emit({ type: 'KILL_SWITCH_TRIGGERED', reason });
      ctx.state = produce(ctx.state, (draft) => {
        draft.isKillSwitchTriggered = true;
      });
    },
    targets: [],
  };
}
