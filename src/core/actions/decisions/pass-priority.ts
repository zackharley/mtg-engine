import { produce } from 'immer';

import type { PlayerId } from '../../primitives/id';
import type { AvailablePlayerDecision } from '../../state/reducer';
import type { GameState } from '../../state/state';

/**
 * Adds PASS_PRIORITY decision.
 */
export function addPassPriorityDecisions(
  _state: GameState,
  _playerId: PlayerId,
  decisions: AvailablePlayerDecision[],
): AvailablePlayerDecision[] {
  return produce(decisions, (draft) => {
    draft.push({ type: 'PASS_PRIORITY' });
  });
}
