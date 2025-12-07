import {
  createTestCard,
  createTestContext,
  createTestPlayer,
} from '@/__tests__/test-utils';

import { defineCard } from '../card/card';
import { parseManaCost } from '../costs/mana-costs';
import { registerCardForPlayer } from '../deck/deck';
import { makeCardId, makePlayerId } from '../primitives/id';
import { createOrderedStack } from '../primitives/ordered-stack';
import { performTurnBasedActions } from './turn-based-actions';
import { Phase, Step } from './turn-structure';

describe('turn-based-actions', () => {
  describe('performTurnBasedActions', () => {
    describe('UNTAP step', () => {
      it('untaps all permanents controlled by active player', () => {
        const playerId = makePlayerId();
        const cardId1 = makeCardId();
        const cardId2 = makeCardId();

        const ctx = createTestContext({
          playerId,
          overrides: {
            players: {
              [playerId]: {
                ...createTestPlayer(playerId),
                battlefield: [cardId1, cardId2],
              },
            },
            cards: {
              [cardId1]: createTestCard(cardId1, playerId, {
                tapped: true,
              }),
              [cardId2]: createTestCard(cardId2, playerId, {
                tapped: true,
              }),
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

        const result = performTurnBasedActions(ctx.state, Step.UNTAP);

        expect(result.cards[cardId1].tapped).toBe(false);
        expect(result.cards[cardId2].tapped).toBe(false);
      });

      it('does not untap permanents controlled by other players', () => {
        const activePlayerId = makePlayerId();
        const otherPlayerId = makePlayerId();
        const activePlayerCardId = makeCardId();
        const otherPlayerCardId = makeCardId();

        const ctx = createTestContext({
          playerId: activePlayerId,
          overrides: {
            players: {
              [activePlayerId]: {
                ...createTestPlayer(activePlayerId),
                name: 'Active Player',
                battlefield: [activePlayerCardId],
              },
              [otherPlayerId]: {
                ...createTestPlayer(otherPlayerId),
                name: 'Other Player',
                battlefield: [otherPlayerCardId],
              },
            },
            cards: {
              [activePlayerCardId]: createTestCard(
                activePlayerCardId,
                activePlayerId,
                {
                  tapped: true,
                },
              ),
              [otherPlayerCardId]: createTestCard(
                otherPlayerCardId,
                otherPlayerId,
                {
                  tapped: true,
                },
              ),
            },
            turn: {
              activePlayerId: activePlayerId,
              startingPlayerId: activePlayerId,
              phase: Phase.BEGINNING,
              step: Step.UNTAP,
              turnNumber: 1,
              landPlayedThisTurn: 0,
            },
          },
        });

        const result = performTurnBasedActions(ctx.state, Step.UNTAP);

        expect(result.cards[activePlayerCardId].tapped).toBe(false);
        expect(result.cards[otherPlayerCardId].tapped).toBe(true);
      });
    });

    describe('DRAW step', () => {
      it('draws a card for active player (rule 504.1)', () => {
        const playerId = makePlayerId();
        const testCard = defineCard({
          scryfallId: 'test-card',
          name: 'Test Card',
          type: 'instant',
          manaCost: parseManaCost('{1}'),
          abilities: [],
        });

        const ctx = createTestContext({
          playerId,
          overrides: {
            turn: {
              activePlayerId: playerId,
              startingPlayerId: playerId,
              phase: Phase.BEGINNING,
              step: Step.DRAW,
              turnNumber: 2, // Use turn 2 to avoid skipping draw on first turn
              landPlayedThisTurn: 0,
            },
          },
        });

        let state = ctx.state;
        state = registerCardForPlayer(state, playerId, testCard, 1);

        const result = performTurnBasedActions(state, Step.DRAW);

        expect(result.players[playerId].hand).toHaveLength(1);
        expect(result.players[playerId].library).toHaveLength(0);
      });

      it('skips draw step for starting player in two-player game on first turn (rule 103.8a)', () => {
        const playerOne = makePlayerId();
        const playerTwo = makePlayerId();
        const testCard = defineCard({
          scryfallId: 'test-card',
          name: 'Test Card',
          type: 'instant',
          manaCost: parseManaCost('{1}'),
          abilities: [],
        });

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
              step: Step.DRAW,
              turnNumber: 1,
              landPlayedThisTurn: 0,
            },
          },
        });

        let state = ctx.state;
        state = registerCardForPlayer(state, playerOne, testCard, 1);

        const result = performTurnBasedActions(state, Step.DRAW);

        // Starting player should not draw on first turn in two-player game
        expect(result.players[playerOne].hand).toHaveLength(0);
        expect(result.players[playerOne].library).toHaveLength(1);
      });

      it('does not skip draw step for starting player in multiplayer game', () => {
        const playerOne = makePlayerId();
        const playerTwo = makePlayerId();
        const playerThree = makePlayerId();
        const testCard = defineCard({
          scryfallId: 'test-card',
          name: 'Test Card',
          type: 'instant',
          manaCost: parseManaCost('{1}'),
          abilities: [],
        });

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
              step: Step.DRAW,
              turnNumber: 1,
              landPlayedThisTurn: 0,
            },
          },
        });

        let state = ctx.state;
        state = registerCardForPlayer(state, playerOne, testCard, 1);

        const result = performTurnBasedActions(state, Step.DRAW);

        // Starting player should draw in multiplayer game
        expect(result.players[playerOne].hand).toHaveLength(1);
        expect(result.players[playerOne].library).toHaveLength(0);
      });

      it('does not draw if library is empty (rule 121.3)', () => {
        const playerId = makePlayerId();
        const ctx = createTestContext({
          playerId,
          overrides: {
            players: {
              [playerId]: {
                ...createTestPlayer(playerId),
                library: createOrderedStack(), // Empty library
              },
            },
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

        const result = performTurnBasedActions(ctx.state, Step.DRAW);

        expect(result.players[playerId].hand).toHaveLength(0);
        expect(result.players[playerId].library).toHaveLength(0);
      });

      it('does not skip draw step on turn 2', () => {
        const playerOne = makePlayerId();
        const playerTwo = makePlayerId();
        const testCard = defineCard({
          scryfallId: 'test-card',
          name: 'Test Card',
          type: 'instant',
          manaCost: parseManaCost('{1}'),
          abilities: [],
        });

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
              step: Step.DRAW,
              turnNumber: 2, // Turn 2, not turn 1
              landPlayedThisTurn: 0,
            },
          },
        });

        let state = ctx.state;
        state = registerCardForPlayer(state, playerOne, testCard, 1);

        const result = performTurnBasedActions(state, Step.DRAW);

        // Should draw on turn 2
        expect(result.players[playerOne].hand).toHaveLength(1);
        expect(result.players[playerOne].library).toHaveLength(0);
      });
    });

    describe('END and CLEANUP steps', () => {
      it('empties all mana pools at end step (rule 500.5)', () => {
        const playerOne = makePlayerId();
        const playerTwo = makePlayerId();
        const ctx = createTestContext({
          playerId: playerOne,
          overrides: {
            players: {
              [playerOne]: {
                ...createTestPlayer(playerOne),
                name: 'Player One',
                manaPool: { W: 1, U: 2, B: 0, R: 3, G: 0 },
              },
              [playerTwo]: {
                ...createTestPlayer(playerTwo),
                name: 'Player Two',
                manaPool: { W: 0, U: 0, B: 1, R: 0, G: 2 },
              },
            },
            turn: {
              activePlayerId: playerOne,
              startingPlayerId: playerOne,
              phase: Phase.ENDING,
              step: Step.END,
              turnNumber: 1,
              landPlayedThisTurn: 0,
            },
          },
        });

        const result = performTurnBasedActions(ctx.state, Step.END);

        expect(result.players[playerOne].manaPool).toEqual({
          W: 0,
          U: 0,
          B: 0,
          R: 0,
          G: 0,
        });
        expect(result.players[playerTwo].manaPool).toEqual({
          W: 0,
          U: 0,
          B: 0,
          R: 0,
          G: 0,
        });
      });

      it('empties all mana pools at cleanup step (rule 500.5)', () => {
        const playerOne = makePlayerId();
        const playerTwo = makePlayerId();
        const ctx = createTestContext({
          playerId: playerOne,
          overrides: {
            players: {
              [playerOne]: {
                ...createTestPlayer(playerOne),
                name: 'Player One',
                manaPool: { W: 5, U: 0, B: 0, R: 0, G: 0 },
              },
              [playerTwo]: {
                ...createTestPlayer(playerTwo),
                name: 'Player Two',
                manaPool: { W: 0, U: 0, B: 0, R: 10, G: 0 },
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

        const result = performTurnBasedActions(ctx.state, Step.CLEANUP);

        expect(result.players[playerOne].manaPool).toEqual({
          W: 0,
          U: 0,
          B: 0,
          R: 0,
          G: 0,
        });
        expect(result.players[playerTwo].manaPool).toEqual({
          W: 0,
          U: 0,
          B: 0,
          R: 0,
          G: 0,
        });
      });
    });

    describe('other steps', () => {
      it('returns state unchanged for steps without turn-based actions', () => {
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

        const result = performTurnBasedActions(ctx.state, Step.UPKEEP);

        expect(result).toBe(ctx.state);
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

        const result = performTurnBasedActions(
          ctx.state,
          null as unknown as Step,
        );

        expect(result).toBe(ctx.state);
      });
    });
  });
});
