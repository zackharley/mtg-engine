import { produce } from 'immer';

import type { PlayerId } from '../../primitives/id';
import type { AvailablePlayerDecision } from '../../state/reducer';
import type { GameState } from '../../state/state';

/**
 * Adds END_GAME decision.
 * Allows ending the game (for testing/debugging).
 */
export function addEndGameDecisions(
  _state: GameState,
  _playerId: PlayerId,
  decisions: AvailablePlayerDecision[],
): AvailablePlayerDecision[] {
  return produce(decisions, (draft) => {
    draft.push({ type: 'END_GAME' });
  });
}
