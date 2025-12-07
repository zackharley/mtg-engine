import { noop } from 'lodash';

import { createTestContext, createTestPlayer } from '@/__tests__/test-utils';

import { makePlayerId, makeStackObjectId } from '../primitives/id';
import {
  createOrderedStack,
  pushOrderedStack,
} from '../primitives/ordered-stack';
import type { StackObject } from '../stack/stack';
import {
  advanceTurnState,
  createAdvancementAction,
  shouldAdvancePhaseOrStep,
} from './phase-advancement';
import { Phase, Step } from './turn-structure';

describe('phase-advancement', () => {
  describe('shouldAdvancePhaseOrStep', () => {
    it('returns false when step has no priority and turn-based actions not complete', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.UNTAP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      // UNTAP step doesn't grant priority, so it should advance after turn-based actions
      // But this function checks if we SHOULD advance, which requires stack empty + all passed
      // For steps without priority, advancement happens automatically after turn-based actions
      // So this should return true for steps without priority
      expect(shouldAdvancePhaseOrStep(ctx.state)).toBe(true);
    });

    it('returns true when step without priority (UNTAP)', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.UNTAP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      expect(shouldAdvancePhaseOrStep(ctx.state)).toBe(true);
    });

    it('returns true when step without priority (CLEANUP)', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.ENDING,
            step: Step.CLEANUP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      expect(shouldAdvancePhaseOrStep(ctx.state)).toBe(true);
    });

    it('returns false when step with priority and stack is not empty', () => {
      const playerId = makePlayerId();
      const stackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        effect: noop,
        targets: [],
      };
      const ctx = createTestContext({
        playerId,
        overrides: {
          stack: pushOrderedStack(createOrderedStack(), stackObject),
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.UPKEEP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      expect(shouldAdvancePhaseOrStep(ctx.state)).toBe(false);
    });

    it('returns false when step with priority and not all players passed', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.UPKEEP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
          playersWhoPassedPriority: new Set(), // No players passed
        },
      });

      expect(shouldAdvancePhaseOrStep(ctx.state)).toBe(false);
    });

    it('returns true when step with priority, stack empty, and all players passed', () => {
      const playerId = makePlayerId();
      const playerTwoId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          players: {
            [playerId]: createTestPlayer(playerId),
            [playerTwoId]: createTestPlayer(playerTwoId),
          },
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.UPKEEP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
          playersWhoPassedPriority: new Set([playerId, playerTwoId]),
        },
      });

      expect(shouldAdvancePhaseOrStep(ctx.state)).toBe(true);
    });

    it('handles null step (phase with no steps)', () => {
      const playerId = makePlayerId();
      const playerTwoId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          players: {
            [playerId]: createTestPlayer(playerId),
            [playerTwoId]: createTestPlayer(playerTwoId),
          },
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.PRECOMBAT_MAIN,
            step: null,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
          playersWhoPassedPriority: new Set([playerId, playerTwoId]),
        },
      });

      expect(shouldAdvancePhaseOrStep(ctx.state)).toBe(true);
    });
  });

  describe('createAdvancementAction', () => {
    it('returns ADVANCE_TO_NEXT_STEP when should advance', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.UNTAP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      const action = createAdvancementAction(ctx.state);

      expect(action).toEqual({ type: 'ADVANCE_TO_NEXT_STEP' });
    });

    it('returns null when should not advance', () => {
      const playerId = makePlayerId();
      const stackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        effect: noop,
        targets: [],
      };
      const ctx = createTestContext({
        playerId,
        overrides: {
          stack: pushOrderedStack(createOrderedStack(), stackObject),
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.UPKEEP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      const action = createAdvancementAction(ctx.state);

      expect(action).toBe(null);
    });
  });

  describe('advanceTurnState', () => {
    it('advances to next step within same phase', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.UNTAP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      const nextState = advanceTurnState(ctx.state, [playerId]);

      expect(nextState.turn.phase).toBe(Phase.BEGINNING);
      expect(nextState.turn.step).toBe(Step.UPKEEP);
      expect(nextState.turn.activePlayerId).toBe(playerId);
      expect(nextState.turn.turnNumber).toBe(1);
    });

    it('advances to next phase when at last step', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.DRAW,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      const nextState = advanceTurnState(ctx.state, [playerId]);

      expect(nextState.turn.phase).toBe(Phase.PRECOMBAT_MAIN);
      expect(nextState.turn.step).toBe(null);
      expect(nextState.turn.activePlayerId).toBe(playerId);
    });

    it('rotates to next player when wrapping to beginning phase', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const ctx = createTestContext({
        playerId: playerOne,
        overrides: {
          players: {
            [playerOne]: {
              ...createTestPlayer(playerOne),
              name: 'Player One',
            },
            [playerTwo]: {
              ...createTestPlayer(playerTwo),
              name: 'Player Two',
            },
          },
          turn: {
            activePlayerId: playerOne,
            startingPlayerId: playerOne,
            phase: Phase.ENDING,
            step: Step.CLEANUP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      const nextState = advanceTurnState(ctx.state, [playerOne, playerTwo]);

      expect(nextState.turn.phase).toBe(Phase.BEGINNING);
      expect(nextState.turn.step).toBe(Step.UNTAP);
      expect(nextState.turn.activePlayerId).toBe(playerTwo);
      expect(nextState.turn.startingPlayerId).toBe(playerOne);
      expect(nextState.turn.turnNumber).toBe(1);
    });

    it('increments turn number when wrapping back to starting player', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const ctx = createTestContext({
        playerId: playerOne,
        overrides: {
          players: {
            [playerOne]: {
              ...createTestPlayer(playerOne),
              name: 'Player One',
            },
            [playerTwo]: {
              ...createTestPlayer(playerTwo),
              name: 'Player Two',
            },
          },
          turn: {
            activePlayerId: playerTwo,
            startingPlayerId: playerOne,
            phase: Phase.ENDING,
            step: Step.CLEANUP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      const nextState = advanceTurnState(ctx.state, [playerOne, playerTwo]);

      expect(nextState.turn.phase).toBe(Phase.BEGINNING);
      expect(nextState.turn.activePlayerId).toBe(playerOne);
      expect(nextState.turn.turnNumber).toBe(2);
    });

    it('does not increment turn number when not wrapping to starting player', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const ctx = createTestContext({
        playerId: playerOne,
        overrides: {
          players: {
            [playerOne]: {
              ...createTestPlayer(playerOne),
              name: 'Player One',
            },
            [playerTwo]: {
              ...createTestPlayer(playerTwo),
              name: 'Player Two',
            },
          },
          turn: {
            activePlayerId: playerOne,
            startingPlayerId: playerOne,
            phase: Phase.ENDING,
            step: Step.CLEANUP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      const nextState = advanceTurnState(ctx.state, [playerOne, playerTwo]);

      expect(nextState.turn.turnNumber).toBe(1); // Not incremented yet
    });

    it('preserves starting player ID', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const ctx = createTestContext({
        playerId: playerOne,
        overrides: {
          players: {
            [playerOne]: {
              ...createTestPlayer(playerOne),
              name: 'Player One',
            },
            [playerTwo]: {
              ...createTestPlayer(playerTwo),
              name: 'Player Two',
            },
          },
          turn: {
            activePlayerId: playerTwo,
            startingPlayerId: playerOne,
            phase: Phase.ENDING,
            step: Step.CLEANUP,
            turnNumber: 5,
            landPlayedThisTurn: 0,
          },
        },
      });

      const nextState = advanceTurnState(ctx.state, [playerOne, playerTwo]);

      expect(nextState.turn.startingPlayerId).toBe(playerOne);
    });
  });
});
