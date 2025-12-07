import { createGame, commanderGameMode } from '../../../src';
import { defineCard } from '../../../src/core/card/card';
import { parseManaCost } from '../../../src/core/costs/mana-costs';

const testCommander = defineCard({
  scryfallId: 'test-commander',
  name: 'Test Commander',
  type: 'creature',
  manaCost: parseManaCost('{3}{R}'),
  abilities: [],
});

const testCard = defineCard({
  scryfallId: 'test-card',
  name: 'Test Card',
  type: 'instant',
  manaCost: parseManaCost('{1}'),
  abilities: [],
});

describe('Commander Game Mode', () => {
  describe('Starting life total', () => {
    it('should set starting life to 40 for all players', () => {
      const settings = commanderGameMode.apply({
        players: [
          {
            name: 'Alice',
            commander: testCommander,
            deck: [{ definition: testCard, count: 1 }],
          },
          {
            name: 'Bob',
            commander: testCommander,
            deck: [{ definition: testCard, count: 1 }],
          },
        ],
      });

      const { controller, playerIds } = createGame(settings);
      const state = controller.getState();
      const [playerOne, playerTwo] = playerIds;

      expect(state.players[playerOne].life).toBe(40);
      expect(state.players[playerTwo].life).toBe(40);
    });

    it('should allow per-player life override', () => {
      const settings = commanderGameMode.apply({
        players: [
          {
            name: 'Alice',
            life: 50,
            commander: testCommander,
            deck: [{ definition: testCard, count: 1 }],
          },
          {
            name: 'Bob',
            commander: testCommander,
            deck: [{ definition: testCard, count: 1 }],
          },
        ],
      });

      const { controller, playerIds } = createGame(settings);
      const state = controller.getState();
      const [playerOne, playerTwo] = playerIds;

      expect(state.players[playerOne].life).toBe(50);
      expect(state.players[playerTwo].life).toBe(40);
    });
  });

  describe('Commander in command zone', () => {
    it('should place each player commander in their command zone', () => {
      const settings = commanderGameMode.apply({
        players: [
          {
            name: 'Alice',
            commander: testCommander,
            deck: [{ definition: testCard, count: 1 }],
          },
          {
            name: 'Bob',
            commander: testCommander,
            deck: [{ definition: testCard, count: 1 }],
          },
        ],
      });

      const { controller, playerIds } = createGame(settings);
      const state = controller.getState();
      const [playerOne, playerTwo] = playerIds;

      expect(state.players[playerOne].commandZone).toHaveLength(1);
      expect(state.players[playerTwo].commandZone).toHaveLength(1);

      // Verify commander card exists
      const playerOneCommanderId = state.players[playerOne].commandZone[0];
      const playerOneCommander = state.cards[playerOneCommanderId];
      expect(playerOneCommander).toBeDefined();
      expect(playerOneCommander.definitionId).toBe(testCommander.id);
      expect(state.cardDefinitions[testCommander.id]).toBeDefined();
    });

    it('should not include commander in library if it was in deck', () => {
      const settings = commanderGameMode.apply({
        players: [
          {
            name: 'Alice',
            commander: testCommander,
            deck: [
              { definition: testCommander, count: 1 }, // Commander in deck
              { definition: testCard, count: 5 },
            ],
          },
        ],
      });

      const { controller, playerIds } = createGame(settings);
      const state = controller.getState();
      const [playerOne] = playerIds;

      // Commander should be in command zone, not library
      expect(state.players[playerOne].commandZone).toHaveLength(1);
      // Library should only have the 5 test cards, not the commander
      expect(state.players[playerOne].library).toHaveLength(5);

      // Verify library doesn't contain commander
      const libraryCardIds = Array.from(state.players[playerOne].library);
      const commanderInLibrary = libraryCardIds.some(
        (cardId) => state.cards[cardId].definitionId === testCommander.id,
      );
      expect(commanderInLibrary).toBe(false);
    });

    it('should require each player to have a commander', () => {
      expect(() => {
        commanderGameMode.apply({
          players: [
            {
              name: 'Alice',
              commander: testCommander,
              deck: [{ definition: testCard, count: 1 }],
            },
            {
              name: 'Bob',
              // Missing commander
              deck: [{ definition: testCard, count: 1 }],
            },
          ],
        });
      }).toThrow(
        'Commander game mode requires each player to have a commander',
      );
    });
  });

  describe('Game mode application', () => {
    it('should preserve other game settings when applying commander mode', () => {
      const baseSettings = {
        players: [
          {
            name: 'Alice',
            commander: testCommander,
            deck: [{ definition: testCard, count: 1 }],
          },
        ],
      };

      const appliedSettings = commanderGameMode.apply(baseSettings);

      expect(appliedSettings.players).toHaveLength(1);
      expect(appliedSettings.players[0].name).toBe('Alice');
      expect(appliedSettings.players[0].commander).toBe(testCommander);
      expect(appliedSettings.startingLife).toBe(40);
    });
  });
});
