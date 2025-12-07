import { createTestContext, createTestPlayer } from '@/__tests__/test-utils';

import { makePlayerId } from '../primitives/id';
import { Phase, Step } from '../turn/turn-structure';
import {
  allPlayersHavePassedPriority,
  getNextPlayerWithPriority,
  markPlayerPassedPriority,
  resetPriorityPasses,
} from './priortity';

describe('priority', () => {
  describe('allPlayersHavePassedPriority', () => {
    it('returns false when no players have passed', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          playersWhoPassedPriority: new Set(),
        },
      });

      expect(allPlayersHavePassedPriority(ctx.state)).toBe(false);
    });

    it('returns false when some players have passed', () => {
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
          playersWhoPassedPriority: new Set([playerOne]),
        },
      });

      expect(allPlayersHavePassedPriority(ctx.state)).toBe(false);
    });

    it('returns true when all players have passed', () => {
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
          playersWhoPassedPriority: new Set([playerOne, playerTwo]),
        },
      });

      expect(allPlayersHavePassedPriority(ctx.state)).toBe(true);
    });

    it('returns false when there are no players', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          players: {},
          playersWhoPassedPriority: new Set(),
        },
      });

      expect(allPlayersHavePassedPriority(ctx.state)).toBe(false);
    });
  });

  describe('markPlayerPassedPriority', () => {
    it('adds player to passed priority set', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          playersWhoPassedPriority: new Set(),
        },
      });

      const result = markPlayerPassedPriority(ctx.state, playerId);

      expect(result.playersWhoPassedPriority.has(playerId)).toBe(true);
    });

    it('preserves existing passed players', () => {
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
          playersWhoPassedPriority: new Set([playerOne]),
        },
      });

      const result = markPlayerPassedPriority(ctx.state, playerTwo);

      expect(result.playersWhoPassedPriority.has(playerOne)).toBe(true);
      expect(result.playersWhoPassedPriority.has(playerTwo)).toBe(true);
    });

    it('returns new state object (immutability)', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          playersWhoPassedPriority: new Set(),
        },
      });

      const result = markPlayerPassedPriority(ctx.state, playerId);

      expect(result).not.toBe(ctx.state);
      expect(result.playersWhoPassedPriority).not.toBe(
        ctx.state.playersWhoPassedPriority,
      );
    });
  });

  describe('resetPriorityPasses', () => {
    it('clears all passed priority players', () => {
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
          playersWhoPassedPriority: new Set([playerOne, playerTwo]),
        },
      });

      const result = resetPriorityPasses(ctx.state);

      expect(result.playersWhoPassedPriority.size).toBe(0);
    });

    it('returns new state object (immutability)', () => {
      const playerId = makePlayerId();
      const ctx = createTestContext({
        playerId,
        overrides: {
          playersWhoPassedPriority: new Set([playerId]),
        },
      });

      const result = resetPriorityPasses(ctx.state);

      expect(result).not.toBe(ctx.state);
      expect(result.playersWhoPassedPriority).not.toBe(
        ctx.state.playersWhoPassedPriority,
      );
    });
  });

  describe('getNextPlayerWithPriority', () => {
    it('returns active player when they have not passed (rule 117.3d)', () => {
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
          playersWhoPassedPriority: new Set(),
        },
      });

      const nextPlayer = getNextPlayerWithPriority(ctx.state);

      expect(nextPlayer).toBe(playerId);
    });

    it('returns next player in turn order when active player passed', () => {
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
            phase: Phase.BEGINNING,
            step: Step.UPKEEP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
          playersWhoPassedPriority: new Set([playerOne]),
        },
      });

      const nextPlayer = getNextPlayerWithPriority(ctx.state);

      expect(nextPlayer).toBe(playerTwo);
    });

    it('returns undefined when all players have passed', () => {
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
            phase: Phase.BEGINNING,
            step: Step.UPKEEP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
          playersWhoPassedPriority: new Set([playerOne, playerTwo]),
        },
      });

      const nextPlayer = getNextPlayerWithPriority(ctx.state);

      expect(nextPlayer).toBeUndefined();
    });

    it('returns undefined when there are no players', () => {
      const ctx = createTestContext();
      ctx.state.players = {};

      const nextPlayer = getNextPlayerWithPriority(ctx.state);

      expect(nextPlayer).toBeUndefined();
    });

    it('throws error when active player not found in players', () => {
      const playerOne = makePlayerId();
      const activePlayerId = makePlayerId();
      const ctx = createTestContext({
        playerId: playerOne,
        overrides: {
          players: {
            [playerOne]: {
              ...createTestPlayer(playerOne),
              name: 'Player One',
            },
          },
          turn: {
            activePlayerId, // Not in players
            startingPlayerId: playerOne,
            phase: Phase.BEGINNING,
            step: Step.UPKEEP,
            turnNumber: 1,
            landPlayedThisTurn: 0,
          },
        },
      });

      expect(() => {
        getNextPlayerWithPriority(ctx.state);
      }).toThrow('Active player');
    });

    it('handles three players correctly', () => {
      const playerOne = makePlayerId();
      const playerTwo = makePlayerId();
      const playerThree = makePlayerId();
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
            [playerThree]: {
              ...createTestPlayer(playerThree),
              name: 'Player Three',
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
          playersWhoPassedPriority: new Set([playerOne]),
        },
      });

      expect(getNextPlayerWithPriority(ctx.state)).toBe(playerTwo);
    });
  });
});
