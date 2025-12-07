import { createTestContext } from '@/__tests__/test-utils';

import { makePlayerId } from '../../primitives/id';
import type { AvailablePlayerDecision } from '../../state/reducer';
import { addPassPriorityDecisions } from './pass-priority';

describe('pass-priority decisions', () => {
  describe('addPassPriorityDecisions', () => {
    it('adds PASS_PRIORITY decision', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addPassPriorityDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(1);
      expect(decisions[0]).toEqual({ type: 'PASS_PRIORITY' });
    });

    it('preserves existing decisions and adds PASS_PRIORITY', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      const existingDecision = { type: 'END_GAME' as const };
      const initialDecisions = [existingDecision];
      const decisions = addPassPriorityDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(2);
      expect(decisions[0]).toEqual(existingDecision);
      expect(decisions[1]).toEqual({ type: 'PASS_PRIORITY' });
    });

    it('does not mutate the original decisions array', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addPassPriorityDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).not.toBe(initialDecisions);
      expect(initialDecisions).toHaveLength(0);
      expect(decisions).toHaveLength(1);
    });

    it('works regardless of player or state', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {},
        },
      });

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addPassPriorityDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(1);
      expect(decisions[0]).toEqual({ type: 'PASS_PRIORITY' });
    });
  });
});
