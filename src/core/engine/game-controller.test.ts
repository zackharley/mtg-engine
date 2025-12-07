import { createTestContext } from '@/__tests__/test-utils';

import { defineCard } from '../card/card';
import { parseManaCost } from '../costs/mana-costs';
import { registerCardForPlayer } from '../deck/deck';
import {
  makeCardDefinitionId,
  makeCardId,
  makePlayerId,
} from '../primitives/id';
import { createOrderedStack } from '../primitives/ordered-stack';
import type { GameEvent } from '../state/reducer';
import type { GameState } from '../state/state';
import { Phase, Step } from '../turn/turn-structure';
import { createGameController } from './game-controller';

describe('game-controller', () => {
  describe('createGameController', () => {
    it('creates controller with initial state', () => {
      const ctx = createTestContext();

      const controller = createGameController(ctx.state);

      expect(controller.getState()).toBeDefined();
      expect(controller.isWaitingForDecision()).toBe(true);
    });

    it('processes turn-based actions on initialization', () => {
      const playerId = makePlayerId();
      const playerTwoId = makePlayerId();
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
            [playerTwoId]: {
              name: 'Test Player 2',
              life: 20,
              manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
              hand: [],
              battlefield: [],
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

      const controller = createGameController(ctx.state);

      // Should untap permanents during UNTAP step
      expect(controller.getState().cards[cardId].tapped).toBe(false);
    });
  });

  describe('GameController', () => {
    describe('getState', () => {
      it('returns current game state', () => {
        const ctx = createTestContext();
        const controller = createGameController(ctx.state);

        const currentState = controller.getState();

        expect(currentState).toBeDefined();
        expect(currentState.players).toBeDefined();
      });
    });

    describe('getEvents', () => {
      it('returns all events', () => {
        const ctx = createTestContext();
        const controller = createGameController(ctx.state);

        const events = controller.getEvents();

        expect(Array.isArray(events)).toBe(true);
      });

      it('returns copy of events array', () => {
        const ctx = createTestContext();
        const controller = createGameController(ctx.state);

        const events1 = controller.getEvents();
        const events2 = controller.getEvents();

        expect(events1).not.toBe(events2);
      });
    });

    describe('isWaitingForDecision', () => {
      it('returns true when decision is pending', () => {
        const ctx = createTestContext();
        const controller = createGameController(ctx.state);

        expect(controller.isWaitingForDecision()).toBe(true);
      });

      it('returns false when no decision pending', () => {
        const ctx = createTestContext({
          overrides: {
            gameEnded: true,
          },
        });
        const controller = createGameController(ctx.state);

        expect(controller.isWaitingForDecision()).toBe(false);
      });
    });

    describe('getPlayerNeedingDecision', () => {
      it('returns player ID when decision pending', () => {
        const playerId = makePlayerId();
        const playerTwoId = makePlayerId();
        const ctx = createTestContext({
          playerId,
          overrides: {
            players: {
              [playerId]: {
                name: 'Test Player',
                life: 20,
                manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
                hand: [],
                battlefield: [],
                graveyard: createOrderedStack(),
                library: createOrderedStack(),
                commandZone: [],
              },
              [playerTwoId]: {
                name: 'Test Player 2',
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
              activePlayerId: playerId,
              startingPlayerId: playerId,
              phase: Phase.BEGINNING,
              step: Step.UPKEEP,
              turnNumber: 1,
              landPlayedThisTurn: 0,
            },
          },
        });
        const controller = createGameController(ctx.state);

        expect(controller.getPlayerNeedingDecision()).toBe(playerId);
      });

      it('returns undefined when no decision pending', () => {
        const ctx = createTestContext({
          overrides: {
            gameEnded: true,
          },
        });
        const controller = createGameController(ctx.state);

        expect(controller.getPlayerNeedingDecision()).toBeUndefined();
      });
    });

    describe('getAvailableDecisions', () => {
      it('returns available decisions when pending', () => {
        const ctx = createTestContext();
        const controller = createGameController(ctx.state);

        const decisions = controller.getAvailableDecisions();

        expect(Array.isArray(decisions)).toBe(true);
      });

      it('returns empty array when no decision pending', () => {
        const ctx = createTestContext({
          overrides: {
            gameEnded: true,
          },
        });
        const controller = createGameController(ctx.state);

        const decisions = controller.getAvailableDecisions();

        expect(decisions).toEqual([]);
      });
    });

    describe('provideDecision', () => {
      it('processes DRAW_CARD decision', () => {
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
              step: Step.UPKEEP,
              turnNumber: 1,
              landPlayedThisTurn: 0,
            },
          },
        });
        let state = ctx.state;
        state = registerCardForPlayer(state, playerId, testCard, 1);
        const controller = createGameController(state);

        expect(controller.isWaitingForDecision()).toBe(true);
        controller.provideDecision({ type: 'DRAW_CARD' });

        expect(
          controller.getState().players[playerId].hand.length,
        ).toBeGreaterThan(0);
      });

      it('processes CAST_SPELL decision', () => {
        const playerId = makePlayerId();
        const testCard = defineCard({
          scryfallId: 'test-card',
          name: 'Test Card',
          type: 'instant',
          manaCost: parseManaCost('{R}'),
          abilities: [
            {
              type: 'spell',
              text: 'Deal 3 damage',
              effect: jest.fn(),
              targets: jest.fn().mockReturnValue([]),
            },
          ],
        });

        const playerTwoId = makePlayerId();
        const ctx = createTestContext({
          playerId,
          overrides: {
            players: {
              [playerId]: {
                name: 'Test Player',
                life: 20,
                manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0 },
                hand: [],
                battlefield: [],
                graveyard: createOrderedStack(),
                library: createOrderedStack(),
                commandZone: [],
              },
              [playerTwoId]: {
                name: 'Test Player 2',
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
              activePlayerId: playerId,
              startingPlayerId: playerId,
              phase: Phase.BEGINNING,
              step: Step.UPKEEP,
              turnNumber: 1,
              landPlayedThisTurn: 0,
            },
          },
        });
        let state = ctx.state;
        state = registerCardForPlayer(state, playerId, testCard, 1);
        const cardId = Array.from(state.players[playerId].library)[0];
        state = {
          ...state,
          players: {
            ...state.players,
            [playerId]: {
              ...state.players[playerId],
              hand: [cardId],
              library: createOrderedStack(),
            },
          },
        };
        const controller = createGameController(state);

        expect(controller.isWaitingForDecision()).toBe(true);
        controller.provideDecision({
          type: 'CAST_SPELL',
          cardId,
          targets: [],
        });

        expect(controller.getState().stack).toHaveLength(1);
      });

      it('processes PLAY_LAND decision', () => {
        const playerId = makePlayerId();
        const testCard = defineCard({
          scryfallId: 'test-land',
          name: 'Test Land',
          type: 'land',
          manaCost: parseManaCost(''),
          abilities: [],
        });

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
        let state = ctx.state;
        state = registerCardForPlayer(state, playerId, testCard, 1);
        const cardId = Array.from(state.players[playerId].library)[0];
        state = {
          ...state,
          players: {
            ...state.players,
            [playerId]: {
              ...state.players[playerId],
              hand: [cardId],
              library: createOrderedStack(),
            },
          },
        };
        const controller = createGameController(state);

        expect(controller.isWaitingForDecision()).toBe(true);
        controller.provideDecision({ type: 'PLAY_LAND', cardId });

        expect(controller.getState().players[playerId].battlefield).toContain(
          cardId,
        );
      });

      it('processes TAP_PERMANENT_FOR_MANA decision', () => {
        const playerId = makePlayerId();
        const testCard = defineCard({
          scryfallId: 'mountain',
          name: 'Mountain',
          type: 'land',
          manaCost: parseManaCost(''),
          abilities: [],
        });

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
        let state = ctx.state;
        state = registerCardForPlayer(state, playerId, testCard, 1);
        const cardId = Array.from(state.players[playerId].library)[0];
        state = {
          ...state,
          players: {
            ...state.players,
            [playerId]: {
              ...state.players[playerId],
              battlefield: [cardId],
              library: createOrderedStack(),
            },
          },
        };
        const controller = createGameController(state);

        expect(controller.isWaitingForDecision()).toBe(true);
        controller.provideDecision({
          type: 'TAP_PERMANENT_FOR_MANA',
          cardId,
        });

        expect(controller.getState().cards[cardId].tapped).toBe(true);
        expect(controller.getState().players[playerId].manaPool.R).toBe(1);
      });

      it('processes PASS decision', () => {
        const ctx = createTestContext();
        const playerId = ctx.state.turn.activePlayerId;
        const controller = createGameController(ctx.state);

        expect(controller.isWaitingForDecision()).toBe(true);
        controller.provideDecision({ type: 'PASS' });

        // Should mark player as passed and continue game loop
        expect(
          controller.getState().playersWhoPassedPriority.has(playerId),
        ).toBe(true);
      });

      it('processes PASS_PRIORITY decision', () => {
        const ctx = createTestContext();
        const playerId = ctx.state.turn.activePlayerId;
        const controller = createGameController(ctx.state);

        expect(controller.isWaitingForDecision()).toBe(true);
        controller.provideDecision({ type: 'PASS_PRIORITY' });

        expect(
          controller.getState().playersWhoPassedPriority.has(playerId),
        ).toBe(true);
      });

      it('processes END_GAME decision', () => {
        const ctx = createTestContext();
        const controller = createGameController(ctx.state);

        expect(controller.isWaitingForDecision()).toBe(true);
        controller.provideDecision({ type: 'END_GAME' });

        expect(controller.getState().gameEnded).toBe(true);
        expect(controller.isWaitingForDecision()).toBe(false);
      });

      it('throws error when no decision pending', () => {
        const ctx = createTestContext({
          overrides: {
            gameEnded: true,
          },
        });
        const controller = createGameController(ctx.state);

        expect(() => {
          controller.provideDecision({ type: 'PASS' });
        }).toThrow('No decision is currently pending');
      });

      it('continues game loop after processing decision', () => {
        const ctx = createTestContext();
        const controller = createGameController(ctx.state);

        expect(controller.isWaitingForDecision()).toBe(true);
        controller.provideDecision({ type: 'PASS' });

        // Game loop should continue, may request another decision or end
        // Just verify it doesn't throw
        expect(controller.getState()).toBeDefined();
      });
    });

    describe('onEvents', () => {
      it('registers event callback', () => {
        const ctx = createTestContext();
        const controller = createGameController(ctx.state);
        const callback = jest.fn();

        controller.onEvents(callback);

        // Callback should be called when events occur
        controller.provideDecision({ type: 'PASS' });

        expect(callback).toHaveBeenCalled();
      });

      it('calls callback with events and state', () => {
        const ctx = createTestContext();
        const controller = createGameController(ctx.state);
        const callback = jest.fn();

        controller.onEvents(callback);
        controller.provideDecision({ type: 'PASS' });

        expect(callback).toHaveBeenCalled();
        const callArgs = callback.mock.calls[0] as [GameEvent[], GameState];
        expect(Array.isArray(callArgs[0])).toBe(true); // events
        expect(callArgs[1]).toBeDefined(); // state
      });

      it('supports multiple callbacks', () => {
        const ctx = createTestContext();
        const controller = createGameController(ctx.state);
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        controller.onEvents(callback1);
        controller.onEvents(callback2);
        controller.provideDecision({ type: 'PASS' });

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });
    });
  });
});
