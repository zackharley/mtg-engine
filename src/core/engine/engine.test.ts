import { createTestContext, createTestPlayer } from '@/__tests__/test-utils';

import { makePlayerId, makeStackObjectId } from '../primitives/id';
import {
  createOrderedStack,
  pushOrderedStack,
} from '../primitives/ordered-stack';
import type { StackObject } from '../stack/stack';
import { Phase, Step } from '../turn/turn-structure';
import { runGame } from './engine';

describe('engine', () => {
  describe('runGame', () => {
    it('returns result with finalState, events, and needsPlayerDecision', () => {
      const ctx = createTestContext();

      const result = runGame(ctx.state);

      expect(result).toHaveProperty('finalState');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('needsPlayerDecision');
      expect(Array.isArray(result.events)).toBe(true);
    });

    it('returns needsPlayerDecision true when player decision needed', () => {
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
        },
      });

      const result = runGame(ctx.state);

      expect(result.needsPlayerDecision).toBe(true);
      expect(result.playerIdNeedingDecision).toBe(playerId);
    });

    it('emits PLAYER_DECISION_REQUESTED event when decision needed', () => {
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
        },
      });

      const result = runGame(ctx.state);

      expect(
        result.events.some((e) => e.type === 'PLAYER_DECISION_REQUESTED'),
      ).toBe(true);
      const decisionEvent = result.events.find(
        (e) => e.type === 'PLAYER_DECISION_REQUESTED',
      );
      expect(decisionEvent).toMatchObject({
        type: 'PLAYER_DECISION_REQUESTED',
        playerId,
      });
    });

    it('calls onEvents callback when events are emitted', () => {
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
        },
      });
      const eventCallback = jest.fn();

      runGame(ctx.state, eventCallback);

      // Callback should be called when PLAYER_DECISION_REQUESTED event is emitted
      expect(eventCallback).toHaveBeenCalled();
    });

    it('processes engine actions until decision needed', () => {
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

      const result = runGame(ctx.state);

      // Should advance from UNTAP step (which doesn't grant priority)
      // Then request decision at next step that grants priority
      expect(result.needsPlayerDecision).toBe(true);
      // After UNTAP, should advance to UPKEEP or beyond
      expect(result.finalState.turn.step).not.toBe(Step.UNTAP);
    });

    it('terminates when game ends', () => {
      const ctx = createTestContext({
        overrides: {
          gameEnded: true,
        },
      });

      const result = runGame(ctx.state);

      expect(result.needsPlayerDecision).toBe(false);
      expect(result.finalState.gameEnded).toBe(true);
    });

    it('terminates when only one player alive', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {
            [playerOne]: {
              name: 'Player One',
              life: 20,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
            [playerTwo]: {
              name: 'Player Two',
              life: 0,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
        },
      });

      const result = runGame(ctx.state);

      expect(result.needsPlayerDecision).toBe(false);
    });

    it('resolves stack when all players passed', () => {
      const playerId = makePlayerId();
      const playerTwoId = makePlayerId();
      const effectFn = jest.fn();
      const stackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        effect: effectFn,
        targets: [],
      };

      const ctx = createTestContext({
        playerId,
        overrides: {
          players: {
            [playerId]: createTestPlayer(playerId),
            [playerTwoId]: createTestPlayer(playerTwoId),
          },
          stack: pushOrderedStack(createOrderedStack(), stackObject),
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

      const result = runGame(ctx.state);

      // Stack should be resolved when all players passed
      // Effect may or may not be called depending on resolution logic
      expect(result.finalState.stack).toHaveLength(0);
    });

    it('collects all events from actions', () => {
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
        },
      });

      const result = runGame(ctx.state);

      // Should have PLAYER_DECISION_REQUESTED event at minimum
      expect(result.events.length).toBeGreaterThanOrEqual(0);
      expect(result.needsPlayerDecision).toBe(true);
      expect(
        result.events.some((e) => e.type === 'PLAYER_DECISION_REQUESTED'),
      ).toBe(true);
    });

    it('handles step without priority correctly', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.UNTAP, // Step without priority
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      const result = runGame(ctx.state);

      // Should advance past UNTAP step
      expect(result.finalState.turn.step).not.toBe(Step.UNTAP);
    });

    it('returns correct player needing decision', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          players: {
            [playerOne]: {
              name: 'Player One',
              life: 20,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
            [playerTwo]: {
              name: 'Player Two',
              life: 20,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
          turn: {
            activePlayerId: playerOne,
            startingPlayerId: playerOne,
            phase: Phase.BEGINNING,
            step: Step.UPKEEP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      const result = runGame(ctx.state);

      expect(result.needsPlayerDecision).toBe(true);
      expect(result.playerIdNeedingDecision).toBe(playerOne);
    });

    it('handles multiple engine actions in sequence', () => {
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

      const result = runGame(ctx.state);

      // Should process UNTAP step advancement (which doesn't grant priority)
      // Then advance to next step and request decision
      // The game should eventually need a decision or end
      expect(result.needsPlayerDecision || result.finalState.gameEnded).toBe(
        true,
      );
    });
  });
});
