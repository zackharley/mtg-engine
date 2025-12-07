import { makePlayerId } from '../primitives/id';
import type { TurnState } from './turn-state';
import { advanceToNextStep, createInitialTurnState } from './turn-state';
import { Phase, Step } from './turn-structure';

describe('turn-state', () => {
  describe('createInitialTurnState', () => {
    it('creates initial turn state for starting player', () => {
      const startingPlayerId = makePlayerId();
      const turnState = createInitialTurnState(startingPlayerId);

      expect(turnState.activePlayerId).toBe(startingPlayerId);
      expect(turnState.startingPlayerId).toBe(startingPlayerId);
      expect(turnState.phase).toBe(Phase.BEGINNING);
      expect(turnState.step).toBe(Step.UNTAP);
      expect(turnState.turnNumber).toBe(1);
      expect(turnState.landPlayedThisTurn).toBe(0);
    });
  });

  describe('advanceToNextStep', () => {
    it('advances to next step within same phase', () => {
      const playerId = makePlayerId();
      const turnState: TurnState = {
        activePlayerId: playerId,
        startingPlayerId: playerId,
        phase: Phase.BEGINNING,
        step: Step.UNTAP,
        turnNumber: 1,
        landPlayedThisTurn: 0,
      };

      const nextState = advanceToNextStep(turnState);

      expect(nextState.phase).toBe(Phase.BEGINNING);
      expect(nextState.step).toBe(Step.UPKEEP);
      expect(nextState.activePlayerId).toBe(playerId);
      expect(nextState.turnNumber).toBe(1);
      expect(nextState.landPlayedThisTurn).toBe(0);
    });

    it('advances to next phase when at last step', () => {
      const playerId = makePlayerId();
      const turnState: TurnState = {
        activePlayerId: playerId,
        startingPlayerId: playerId,
        phase: Phase.BEGINNING,
        step: Step.DRAW,
        turnNumber: 1,
        landPlayedThisTurn: 0,
      };

      const nextState = advanceToNextStep(turnState);

      expect(nextState.phase).toBe(Phase.PRECOMBAT_MAIN);
      expect(nextState.step).toBe(null);
      expect(nextState.activePlayerId).toBe(playerId);
      expect(nextState.turnNumber).toBe(1);
      expect(nextState.landPlayedThisTurn).toBe(0);
    });

    it('resets landPlayedThisTurn when wrapping to beginning phase', () => {
      const playerId = makePlayerId();
      const turnState: TurnState = {
        activePlayerId: playerId,
        startingPlayerId: playerId,
        phase: Phase.ENDING,
        step: Step.CLEANUP,
        turnNumber: 1,
        landPlayedThisTurn: 1,
      };

      const nextState = advanceToNextStep(turnState);

      expect(nextState.phase).toBe(Phase.BEGINNING);
      expect(nextState.step).toBe(Step.UNTAP);
      expect(nextState.landPlayedThisTurn).toBe(0);
    });

    it('does not reset landPlayedThisTurn when not wrapping to beginning', () => {
      const playerId = makePlayerId();
      const turnState: TurnState = {
        activePlayerId: playerId,
        startingPlayerId: playerId,
        phase: Phase.BEGINNING,
        step: Step.UPKEEP,
        turnNumber: 1,
        landPlayedThisTurn: 1,
      };

      const nextState = advanceToNextStep(turnState);

      expect(nextState.phase).toBe(Phase.BEGINNING);
      expect(nextState.step).toBe(Step.DRAW);
      expect(nextState.landPlayedThisTurn).toBe(1);
    });

    it('preserves other turn state properties', () => {
      const playerId = makePlayerId();
      const otherPlayerId = makePlayerId();
      const turnState: TurnState = {
        activePlayerId: otherPlayerId,
        startingPlayerId: playerId,
        phase: Phase.BEGINNING,
        step: Step.UNTAP,
        turnNumber: 5,
        landPlayedThisTurn: 2,
      };

      const nextState = advanceToNextStep(turnState);

      expect(nextState.activePlayerId).toBe(otherPlayerId);
      expect(nextState.startingPlayerId).toBe(playerId);
      expect(nextState.turnNumber).toBe(5);
    });

    it('handles phases with no steps', () => {
      const playerId = makePlayerId();
      const turnState: TurnState = {
        activePlayerId: playerId,
        startingPlayerId: playerId,
        phase: Phase.PRECOMBAT_MAIN,
        step: null,
        turnNumber: 1,
        landPlayedThisTurn: 0,
      };

      const nextState = advanceToNextStep(turnState);

      expect(nextState.phase).toBe(Phase.COMBAT);
      expect(nextState.step).toBe(Step.BEGINNING_OF_COMBAT);
    });
  });
});
