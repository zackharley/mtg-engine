import { createTestContext } from '@/__tests__/test-utils';

import {
  makeCardDefinitionId,
  makeCardId,
  makePlayerId,
} from '../../primitives/id';
import { createOrderedStack } from '../../primitives/ordered-stack';
import { Phase, Step } from '../../turn/turn-structure';
import handleAdvanceToNextStep from './advance-to-next-step';

describe('advance-to-next-step', () => {
  describe('handleAdvanceToNextStep', () => {
    it('advances to next step', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
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

      handleAdvanceToNextStep(ctx, { type: 'ADVANCE_TO_NEXT_STEP' });

      expect(ctx.state.turn.step).toBe(Step.UPKEEP);
      expect(ctx.state.turn.phase).toBe(Phase.BEGINNING);
    });

    it('performs turn-based actions for new step', () => {
      const playerId = makePlayerId();
      const cardId = makeCardId();
      const ctx = createTestContext({
        overrides: {
          players: {
            [playerId]: {
              name: 'Test Player',
              life: 20,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [cardId],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
          cards: {
            [cardId]: {
              id: cardId,
              definitionId: makeCardDefinitionId(),
              controllerId: playerId,
              tapped: true,
            },
          },
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

      handleAdvanceToNextStep(ctx, { type: 'ADVANCE_TO_NEXT_STEP' });

      // Should untap permanents during UNTAP step
      // Then advance to UPKEEP
      expect(ctx.state.turn.step).toBe(Step.UPKEEP);
    });

    it('resets priority passes when entering new step', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.BEGINNING,
            step: Step.UNTAP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
          playersWhoPassedPriority: new Set([playerId]),
        },
      });

      handleAdvanceToNextStep(ctx, { type: 'ADVANCE_TO_NEXT_STEP' });

      expect(ctx.state.playersWhoPassedPriority.size).toBe(0);
    });

    it('rotates to next player when wrapping to beginning phase', () => {
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
            phase: Phase.ENDING,
            step: Step.CLEANUP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      handleAdvanceToNextStep(ctx, { type: 'ADVANCE_TO_NEXT_STEP' });

      expect(ctx.state.turn.phase).toBe(Phase.BEGINNING);
      expect(ctx.state.turn.step).toBe(Step.UNTAP);
      expect(ctx.state.turn.activePlayerId).toBe(playerTwo);
    });

    it('does not perform turn-based actions when step is null', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        overrides: {
          turn: {
            activePlayerId: playerId,
            startingPlayerId: playerId,
            phase: Phase.PRECOMBAT_MAIN,
            step: null,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      handleAdvanceToNextStep(ctx, { type: 'ADVANCE_TO_NEXT_STEP' });

      // Should advance to next phase
      expect(ctx.state.turn.phase).toBe(Phase.COMBAT);
    });
  });
});
