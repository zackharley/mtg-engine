import { CardDefinition } from '../card/card';
import { defineCard } from '../card/card';
import { parseManaCost } from '../costs/mana-costs';
import { registerCardForPlayer, drawCard } from './deck';
import { GameState } from '../state/state';
import { makePlayerId } from '../primitives/id';
import { createOrderedStack } from '../primitives/ordered-stack';
import { createInitialTurnState } from '../turn/turn-state';

describe('deck utilities', () => {
  const testCardDefinition: CardDefinition = defineCard({
    scryfallId: 'test-card-1',
    name: 'Test Card',
    type: 'instant',
    manaCost: parseManaCost('{1}'),
    abilities: [],
  });

  describe('registerCardsForPlayer', () => {
    it('creates card instances and adds them to player library', () => {
      const playerId = makePlayerId();
      const initialState: GameState = {
        players: {
          [playerId]: {
            life: 20,
            manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
            hand: [],
            battlefield: [],
            graveyard: createOrderedStack(),
            library: createOrderedStack(),
          },
        },
        cards: {},
        cardDefinitions: {},
        stack: createOrderedStack(),
        turn: createInitialTurnState(playerId),
        gameEnded: false,
        playersWhoPassedPriority: new Set(),
      };

      const result = registerCardForPlayer(
        initialState,
        playerId,
        testCardDefinition,
        2,
      );

      expect(result.cardDefinitions[testCardDefinition.id]).toEqual(
        testCardDefinition,
      );
      expect(result.players[playerId].library).toHaveLength(2);
      expect(Object.keys(result.cards)).toHaveLength(2);

      // Verify each card instance has unique ID but same definition
      const cardIds = Array.from(result.players[playerId].library);
      expect(cardIds[0]).not.toBe(cardIds[1]);
      expect(result.cards[cardIds[0]].definitionId).toBe(testCardDefinition.id);
      expect(result.cards[cardIds[1]].definitionId).toBe(testCardDefinition.id);
    });

    it('allows multiple players to use the same card definition', () => {
      const playerOneId = makePlayerId();
      const playerTwoId = makePlayerId();

      const initialState: GameState = {
        players: {
          [playerOneId]: {
            life: 20,
            manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
            hand: [],
            battlefield: [],
            graveyard: createOrderedStack(),
            library: createOrderedStack(),
          },
          [playerTwoId]: {
            life: 20,
            manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
            hand: [],
            battlefield: [],
            graveyard: createOrderedStack(),
            library: createOrderedStack(),
          },
        },
        cards: {},
        cardDefinitions: {},
        stack: createOrderedStack(),
        turn: createInitialTurnState(playerOneId),
        gameEnded: false,
        playersWhoPassedPriority: new Set(),
      };

      const afterPlayerOne = registerCardForPlayer(
        initialState,
        playerOneId,
        testCardDefinition,
        1,
      );
      const afterPlayerTwo = registerCardForPlayer(
        afterPlayerOne,
        playerTwoId,
        testCardDefinition,
        1,
      );

      // Both players should have the card definition
      expect(
        afterPlayerTwo.cardDefinitions[testCardDefinition.id],
      ).toBeDefined();

      // But each player has their own card instance
      const playerOneLibrary = Array.from(
        afterPlayerTwo.players[playerOneId].library,
      );
      const playerTwoLibrary = Array.from(
        afterPlayerTwo.players[playerTwoId].library,
      );
      const playerOneCardId = playerOneLibrary[0];
      const playerTwoCardId = playerTwoLibrary[0];
      expect(playerOneCardId).not.toBe(playerTwoCardId);
      expect(afterPlayerTwo.cards[playerOneCardId].definitionId).toBe(
        testCardDefinition.id,
      );
      expect(afterPlayerTwo.cards[playerTwoCardId].definitionId).toBe(
        testCardDefinition.id,
      );
    });

    it('throws error if player does not exist', () => {
      const playerId = makePlayerId();
      const initialState: GameState = {
        players: {},
        cards: {},
        cardDefinitions: {},
        stack: createOrderedStack(),
        turn: createInitialTurnState(playerId),
        gameEnded: false,
        playersWhoPassedPriority: new Set(),
      };

      expect(() => {
        registerCardForPlayer(initialState, playerId, testCardDefinition, 1);
      }).toThrow(`Player ${playerId} not found in game state`);
    });
  });

  describe('drawCard', () => {
    it('moves a card from library to hand', () => {
      const playerId = makePlayerId();
      const initialState: GameState = {
        players: {
          [playerId]: {
            life: 20,
            manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
            hand: [],
            battlefield: [],
            graveyard: createOrderedStack(),
            library: createOrderedStack(),
          },
        },
        cards: {},
        cardDefinitions: {},
        stack: createOrderedStack(),
        turn: createInitialTurnState(playerId),
        gameEnded: false,
        playersWhoPassedPriority: new Set(),
      };

      const withCards = registerCardForPlayer(
        initialState,
        playerId,
        testCardDefinition,
        2,
      );
      const cardIds = Array.from(withCards.players[playerId].library);

      const result = drawCard(withCards, playerId);

      expect(result.players[playerId].library).toHaveLength(1);
      expect(result.players[playerId].hand).toHaveLength(1);
      expect(result.players[playerId].hand[0]).toBe(
        cardIds[cardIds.length - 1],
      );
    });

    it('throws error if library is empty', () => {
      const playerId = makePlayerId();
      const initialState: GameState = {
        players: {
          [playerId]: {
            life: 20,
            manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
            hand: [],
            battlefield: [],
            graveyard: createOrderedStack(),
            library: createOrderedStack(),
          },
        },
        cards: {},
        cardDefinitions: {},
        stack: createOrderedStack(),
        turn: createInitialTurnState(playerId),
        gameEnded: false,
        playersWhoPassedPriority: new Set(),
      };

      expect(() => {
        drawCard(initialState, playerId);
      }).toThrow(`Player ${playerId} has no cards in library to draw`);
    });

    it('throws error if player does not exist', () => {
      const playerId = makePlayerId();
      const initialState: GameState = {
        players: {},
        cards: {},
        cardDefinitions: {},
        stack: createOrderedStack(),
        turn: createInitialTurnState(playerId),
        gameEnded: false,
        playersWhoPassedPriority: new Set(),
      };

      expect(() => {
        drawCard(initialState, playerId);
      }).toThrow(`Player ${playerId} not found in game state`);
    });
  });
});
