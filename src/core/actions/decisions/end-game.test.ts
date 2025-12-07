import { createTestContext } from '@/__tests__/test-utils';

import { makePlayerId } from '../../primitives/id';
import type { AvailablePlayerDecision } from '../../state/reducer';
import { addEndGameDecisions } from './end-game';

describe('end-game decisions', () => {
  describe('addEndGameDecisions', () => {
    it('adds END_GAME decision', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addEndGameDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(1);
      expect(decisions[0]).toEqual({ type: 'END_GAME' });
    });

    it('preserves existing decisions and adds END_GAME', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      const existingDecision = { type: 'PASS_PRIORITY' as const };
      const initialDecisions = [existingDecision];
      const decisions = addEndGameDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(2);
      expect(decisions[0]).toEqual(existingDecision);
      expect(decisions[1]).toEqual({ type: 'END_GAME' });
    });

    it('does not mutate the original decisions array', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({ playerId });

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addEndGameDecisions(
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
      const decisions = addEndGameDecisions(
        ctx.state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(1);
      expect(decisions[0]).toEqual({ type: 'END_GAME' });
    });
  });
});
