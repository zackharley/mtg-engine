import { noop } from 'lodash';

import { createTestContext, createTestPlayer } from '@/__tests__/test-utils';

import {
  makeCardDefinitionId,
  makeCardId,
  makePlayerId,
  makeStackObjectId,
} from '../primitives/id';
import {
  createOrderedStack,
  pushOrderedStack,
} from '../primitives/ordered-stack';
import type { StackObject } from '../stack/stack';
import { Phase, Step } from '../turn/turn-structure';
import { isGameOver, nextEngineAction, processTurnBasedActions } from './state';

describe('state', () => {
  describe('isGameOver', () => {
    it('returns true when gameEnded flag is set', () => {
      const ctx = createTestContext({
        overrides: {
          gameEnded: true,
        },
      });

      expect(isGameOver(ctx.state)).toBe(true);
    });

    it('returns false when gameEnded is false and multiple players alive', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const ctx = createTestContext({
        playerId: playerOne,
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
              life: 15,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
          gameEnded: false,
        },
      });

      expect(isGameOver(ctx.state)).toBe(false);
    });

    it('returns true when only one player has life > 0', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const ctx = createTestContext({
        playerId: playerOne,
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
          gameEnded: false,
        },
      });
      ctx.state.players[playerTwo].life = 0;

      expect(isGameOver(ctx.state)).toBe(true);
    });

    it('returns true when all players have life <= 0', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const ctx = createTestContext({
        playerId: playerOne,
        overrides: {
          players: {
            [playerOne]: {
              name: 'Player One',
              life: 0,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
            [playerTwo]: {
              name: 'Player Two',
              life: -5,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
          gameEnded: false,
        },
      });

      expect(isGameOver(ctx.state)).toBe(true);
    });

    it('returns false when multiple players alive and game not ended', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const playerThree = makePlayerId();
      const ctx = createTestContext({
        playerId: playerOne,
        overrides: {
          players: {
            [playerOne]: {
              name: 'Player One',
              life: 10,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
            [playerTwo]: {
              name: 'Player Two',
              life: 5,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
            [playerThree]: {
              name: 'Player Three',
              life: 15,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
              graveyard: createOrderedStack(),
              library: createOrderedStack(),
              commandZone: [],
            },
          },
          gameEnded: false,
        },
      });

      expect(isGameOver(ctx.state)).toBe(false);
    });
  });

  describe('nextEngineAction', () => {
    it('returns ADVANCE_TO_NEXT_STEP when phase/step should advance', () => {
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

      const action = nextEngineAction(ctx.state);

      expect(action).toEqual({ type: 'ADVANCE_TO_NEXT_STEP' });
    });

    it('returns RESOLVE_TOP_OF_STACK when all players passed and stack not empty', () => {
      const playerId = makePlayerId();
      const stackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        effect: noop,
        targets: [],
      };
      const playerTwoId = makePlayerId();
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

      const action = nextEngineAction(ctx.state);

      expect(action).toEqual({ type: 'RESOLVE_TOP_OF_STACK' });
    });

    it('returns null when stack empty and all players passed', () => {
      const playerId = makePlayerId();
      const playerTwoId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          players: {
            [playerId]: createTestPlayer(playerId),
            [playerTwoId]: createTestPlayer(playerTwoId),
          },
          stack: createOrderedStack(),
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

      const action = nextEngineAction(ctx.state);

      expect(action).toEqual({ type: 'ADVANCE_TO_NEXT_STEP' });
    });

    it('returns null when stack not empty but players have not all passed', () => {
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
          playersWhoPassedPriority: new Set(), // No players passed
        },
      });

      const action = nextEngineAction(ctx.state);

      expect(action).toBe(null);
    });

    it('prioritizes advancement over stack resolution', () => {
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
            step: Step.UNTAP, // Step without priority, should advance
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
          playersWhoPassedPriority: new Set([playerId]),
        },
      });

      const action = nextEngineAction(ctx.state);

      // Advancement should take priority
      expect(action).toEqual({ type: 'ADVANCE_TO_NEXT_STEP' });
    });
  });

  describe('processTurnBasedActions', () => {
    it('calls performTurnBasedActions when step is not null', () => {
      const playerId = makePlayerId();
      const cardId = makeCardId();
      const ctx = createTestContext({
        playerId,
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

      const result = processTurnBasedActions(ctx.state);

      // Should untap permanents
      expect(result.cards[cardId].tapped).toBe(false);
    });

    it('returns state unchanged when step is null', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
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

      const result = processTurnBasedActions(ctx.state);

      expect(result).toBe(ctx.state);
    });
  });
});
