import { createCommanderGame, createGame } from '../../../src';
import { defineCard } from '../../../src/core/card/card';
import { parseManaCost } from '../../../src/core/costs/mana-costs';
import { Phase } from '../../core/turn/turn-structure';
import { passUntilPhaseStep } from '../utils/game-navigation';

//TODO: Replace with a real card
const testCard = defineCard({
  scryfallId: 'test-card',
  name: 'Test Card',
  type: 'instant',
  manaCost: parseManaCost('{1}'),
  abilities: [],
});

//TODO: Replace with a real card
const testCommander = defineCard({
  scryfallId: 'test-commander',
  name: 'Test Commander',
  type: 'creature',
  manaCost: parseManaCost('{3}{R}'),
  abilities: [],
});

describe('Rule 103: Starting the Game', () => {
  describe('103.1: Determining the starting player', () => {
    it('should set the first player in the array as the starting player', () => {
      const { controller, playerIds } = createGame({
        players: [
          { name: 'Alice', deck: [{ definition: testCard, count: 1 }] },
          { name: 'Bob', deck: [{ definition: testCard, count: 1 }] },
        ],
      });

      const state = controller.getState();
      const [playerOne] = playerIds;

      expect(state.turn.activePlayerId).toBe(playerOne);
      expect(state.turn.turnNumber).toBe(1);
      expect(state.players[playerOne].name).toBe('Alice');
    });

    it('should begin turn order with starting player and proceed clockwise', () => {
      const { controller, playerIds } = createGame({
        players: [
          { name: 'Alice', deck: [{ definition: testCard, count: 1 }] },
          { name: 'Bob', deck: [{ definition: testCard, count: 1 }] },
          { name: 'Charlie', deck: [{ definition: testCard, count: 1 }] },
        ],
      });

      const state = controller.getState();
      const [playerOne, playerTwo, playerThree] = playerIds;

      expect(state.turn.activePlayerId).toBe(playerOne);
      expect(state.players[playerOne].name).toBe('Alice');
      expect(state.players[playerTwo].name).toBe('Bob');
      expect(state.players[playerThree].name).toBe('Charlie');
      // Verify turn order proceeds clockwise after first turn completes

      expect(controller.isWaitingForDecision()).toBe(true);

      expect(controller.getPlayerNeedingDecision()).toBe(playerOne);
      controller.provideDecision({ type: 'PASS_PRIORITY' });

      expect(controller.getPlayerNeedingDecision()).toBe(playerTwo);
      controller.provideDecision({ type: 'PASS_PRIORITY' });

      expect(controller.getPlayerNeedingDecision()).toBe(playerThree);
      controller.provideDecision({ type: 'PASS_PRIORITY' });

      expect(controller.getPlayerNeedingDecision()).toBe(playerOne);
    });

    // TODO: 103.1 - Test match-based starting player determination
    // In a match of several games, the loser of the previous game chooses
    // If the previous game was a draw, the player who made the choice in that game makes the choice

    // TODO: 103.1a - Shared team turns option
    // In a game using the shared team turns option, there is a starting team rather than a starting player

    // TODO: 103.1b - Archenemy game
    // In an Archenemy game, the archenemy takes the first turn

    // TODO: 103.1c - Power Play card
    // One card (Power Play) states that its controller is the starting player
    // This effect applies after determination and supersedes these methods
  });

  describe('103.2: Additional steps after starting player determination', () => {
    // TODO: 103.2a - Sideboards and substitute cards
    // If any players are using sideboards or cards being represented by substitute cards,
    // those cards are set aside. After this happens, each player's deck is considered their starting deck

    // TODO: 103.2b - Companion ability
    // If any players wish to reveal a card with a companion ability that they own from outside the game,
    // they may do so. A player may reveal no more than one card this way, and they may do so only if
    // their deck fulfills the condition of that card's companion ability

    describe('103.2c: In a Commander game, each player puts their commander from their deck face up into the command zone', () => {
      it("should place each player's commander in their command zone", () => {
        const settings = createCommanderGame({
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
            {
              name: 'Charlie',
              commander: testCommander,
              deck: [{ definition: testCard, count: 1 }],
            },
            {
              name: 'Dave',
              commander: testCommander,
              deck: [{ definition: testCard, count: 1 }],
            },
          ],
        });
        const { controller, playerIds } = createGame(settings);
        const state = controller.getState();
        const [playerOne, playerTwo, playerThree, playerFour] = playerIds;
        expect(state.players[playerOne].commandZone).toHaveLength(1);
        expect(state.players[playerTwo].commandZone).toHaveLength(1);
        expect(state.players[playerThree].commandZone).toHaveLength(1);
        expect(state.players[playerFour].commandZone).toHaveLength(1);
        expect(
          state.cards[state.players[playerOne].commandZone[0]].definitionId,
        ).toBe(testCommander.id);
        expect(
          state.cards[state.players[playerTwo].commandZone[0]].definitionId,
        ).toBe(testCommander.id);
        expect(
          state.cards[state.players[playerThree].commandZone[0]].definitionId,
        ).toBe(testCommander.id);
        expect(
          state.cards[state.players[playerFour].commandZone[0]].definitionId,
        ).toBe(testCommander.id);
      });
    });

    // TODO: 103.2d - Sticker sheets
    // In a constructed game, each player playing with sticker sheets reveals all of their sticker sheets
    // and chooses three of them at random. In a limited game, each player chooses up to three sticker sheets

    // TODO: 103.2e - Conspiracy Draft game
    // In a Conspiracy Draft game, each player puts any number of conspiracy cards from their sideboard
    // into the command zone
  });

  describe('103.3: Shuffling decks', () => {
    it('should shuffle each player deck so cards are in random order', () => {
      // Create multiple unique card definitions to properly test shuffling
      const cardA = defineCard({
        scryfallId: 'card-a',
        name: 'Card A',
        type: 'instant',
        manaCost: parseManaCost('{1}'),
        abilities: [],
      });
      const cardB = defineCard({
        scryfallId: 'card-b',
        name: 'Card B',
        type: 'instant',
        manaCost: parseManaCost('{2}'),
        abilities: [],
      });
      const cardC = defineCard({
        scryfallId: 'card-c',
        name: 'Card C',
        type: 'instant',
        manaCost: parseManaCost('{3}'),
        abilities: [],
      });
      const cardD = defineCard({
        scryfallId: 'card-d',
        name: 'Card D',
        type: 'instant',
        manaCost: parseManaCost('{4}'),
        abilities: [],
      });
      const cardE = defineCard({
        scryfallId: 'card-e',
        name: 'Card E',
        type: 'instant',
        manaCost: parseManaCost('{5}'),
        abilities: [],
      });

      // Create a deck with a mix of unique cards and duplicates
      // Deck: 3x Card A, 2x Card B, 1x Card C, 4x Card D, 2x Card E (total: 12 cards)
      // After drawing 7 cards, 5 remain in library
      const deck = [
        { definition: cardA, count: 3 },
        { definition: cardB, count: 2 },
        { definition: cardC, count: 1 },
        { definition: cardD, count: 4 },
        { definition: cardE, count: 2 },
      ];

      // Test deterministic shuffling with same seed
      const seed1 = 'shuffle-test-seed-1';
      const { controller: controller1, playerIds: playerIds1 } = createGame({
        seed: seed1,
        players: [{ name: 'Alice', deck }],
      });

      const { controller: controller2, playerIds: playerIds2 } = createGame({
        seed: seed1,
        players: [{ name: 'Alice', deck }],
      });

      const state1 = controller1.getState();
      const state2 = controller2.getState();
      const [playerOne1] = playerIds1;
      const [playerOne2] = playerIds2;

      // After shuffling (rule 103.3) and drawing initial hands (rule 103.5),
      // player should have 7 cards in hand and 5 remaining in library
      expect(state1.players[playerOne1].hand).toHaveLength(7);
      expect(state1.players[playerOne1].library).toHaveLength(5);

      // Extract definition IDs from library to compare order
      const getLibraryDefinitionIds = (
        state: typeof state1,
        playerId: typeof playerOne1,
      ) => {
        return Array.from(state.players[playerId].library).map(
          (cardId) => state.cards[cardId].definitionId,
        );
      };

      const library1DefIds = getLibraryDefinitionIds(state1, playerOne1);
      const library2DefIds = getLibraryDefinitionIds(state2, playerOne2);

      // With the same seed, the library order should be deterministic
      // (card IDs differ, but definition IDs should be in the same order)
      expect(library1DefIds).toEqual(library2DefIds);

      // Test that shuffling actually occurred - order should not match registration order
      // Cards are registered sequentially: A(3x), B(2x), C(1x), D(4x), E(2x)
      // If cards were not shuffled, after drawing 7 from top, library would contain
      // the bottom 5 cards in registration order: [D, D, D, E, E]
      // With proper shuffling, the order should be randomized
      const registrationOrderBottom5 = [
        cardD.id,
        cardD.id,
        cardD.id,
        cardE.id,
        cardE.id,
      ];
      expect(library1DefIds).not.toEqual(registrationOrderBottom5);

      // Test that different seeds produce different orders
      const seed2 = 'shuffle-test-seed-2';
      const { controller: controller3, playerIds: playerIds3 } = createGame({
        seed: seed2,
        players: [{ name: 'Alice', deck }],
      });
      const state3 = controller3.getState();
      const [playerOne3] = playerIds3;
      const library3DefIds = getLibraryDefinitionIds(state3, playerOne3);

      // Different seeds should produce different orders (very unlikely to be the same)
      expect(library3DefIds).not.toEqual(library1DefIds);

      // Verify library contains exactly 5 cards (12 total - 7 drawn = 5 remaining)
      expect(library1DefIds).toHaveLength(5);

      // Verify all cards in library are from the expected card definitions
      const validDefinitionIds = new Set([
        cardA.id,
        cardB.id,
        cardC.id,
        cardD.id,
        cardE.id,
      ]);
      library1DefIds.forEach((defId) => {
        expect(validDefinitionIds.has(defId)).toBe(true);
      });
    });

    it('should set players decks as their libraries after shuffling', () => {
      const { controller, playerIds } = createGame({
        players: [
          { name: 'Alice', deck: [{ definition: testCard, count: 5 }] },
        ],
      });

      const state = controller.getState();
      const [playerOne] = playerIds;

      // After shuffling (rule 103.3) and drawing initial hand (rule 103.5),
      // player should have drawn up to 7 cards (or all available if less than 7)
      expect(state.players[playerOne].library).toHaveLength(0);
      expect(state.players[playerOne].hand).toHaveLength(5); // All 5 cards drawn (less than 7)
    });

    // TODO: 103.3 - Opponents may shuffle or cut opponents' decks
    // Each player may then shuffle or cut their opponents' decks

    // TODO: 103.3a - Supplementary decks
    // In a game using one or more supplementary decks of nontraditional cards,
    // each supplementary deck's owner shuffles it so the cards are in a random order
  });

  describe('103.4: Starting life totals', () => {
    it('should begin each player with a starting life total of 20 by default', () => {
      const { controller, playerIds } = createGame({
        players: [
          { name: 'Alice', deck: [{ definition: testCard, count: 1 }] },
          { name: 'Bob', deck: [{ definition: testCard, count: 1 }] },
        ],
      });

      const state = controller.getState();
      const [playerOne, playerTwo] = playerIds;

      expect(state.players[playerOne].life).toBe(20);
      expect(state.players[playerTwo].life).toBe(20);
      expect(state.players[playerOne].name).toBe('Alice');
      expect(state.players[playerTwo].name).toBe('Bob');
    });

    it('should allow custom starting life total via settings', () => {
      const { controller, playerIds } = createGame({
        startingLife: 25,
        players: [
          { name: 'Alice', deck: [{ definition: testCard, count: 1 }] },
          { name: 'Bob', deck: [{ definition: testCard, count: 1 }] },
        ],
      });

      const state = controller.getState();
      const [playerOne, playerTwo] = playerIds;

      expect(state.players[playerOne].life).toBe(25);
      expect(state.players[playerTwo].life).toBe(25);
      expect(state.players[playerOne].name).toBe('Alice');
      expect(state.players[playerTwo].name).toBe('Bob');
    });

    it('should allow per-player custom life total', () => {
      const { controller, playerIds } = createGame({
        startingLife: 20,
        players: [
          {
            name: 'Alice',
            life: 30,
            deck: [{ definition: testCard, count: 1 }],
          },
          { name: 'Bob', deck: [{ definition: testCard, count: 1 }] },
        ],
      });

      const state = controller.getState();
      const [playerOne, playerTwo] = playerIds;

      expect(state.players[playerOne].life).toBe(30);
      expect(state.players[playerTwo].life).toBe(20);
    });

    // TODO: 103.4a - Two-Headed Giant game
    // In a Two-Headed Giant game, each team's starting life total is 30

    // TODO: 103.4b - Vanguard game
    // In a Vanguard game, each player's starting life total is 20 plus or minus
    // the life modifier of their vanguard card

    describe("103.4c: In a Commander game, each player's starting life total is 40", () => {
      it("should set each player's starting life total to 40", () => {
        const settings = createCommanderGame({
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
    });

    // TODO: 103.4d - Brawl game
    // In a two-player Brawl game, each player's starting life total is 25
    // In a multiplayer Brawl game, each player's starting life total is 30

    // TODO: 103.4e - Archenemy game
    // In an Archenemy game, the archenemy's starting life total is 40
  });

  describe('103.5: Starting hand size and mulligans', () => {
    // TODO: 103.5 - Starting hand size and mulligan process
    // Each player draws a number of cards equal to their starting hand size, which is normally seven
    // A player who is dissatisfied with their initial hand may take a mulligan
    // First, the starting player declares whether they will take a mulligan
    // Then each other player in turn order does the same
    // Once each player has made a declaration, all players who decided to take mulligans do so at the same time
    // To take a mulligan, a player shuffles the cards in their hand back into their library,
    // draws a new hand of cards equal to their starting hand size, then puts a number of those cards
    // equal to the number of times that player has taken a mulligan on the bottom of their library in any order
    // Once a player chooses not to take a mulligan, the remaining cards become that player's opening hand,
    // and that player may not take any further mulligans
    // This process is then repeated until no player takes a mulligan
    // A player can take mulligans until their opening hand would be zero cards, after which they may not take further mulligans
    // TODO: 103.5a - Vanguard game starting hand size
    // In a Vanguard game, each player's starting hand size is seven plus or minus
    // the hand modifier of their vanguard card
    // TODO: 103.5b - Actions "any time [that player] could mulligan"
    // If an effect allows a player to perform an action "any time [that player] could mulligan,"
    // the player may perform that action at a time they would declare whether they will take a mulligan
    // This need not be in the first round of mulligans
    // Other players may have already made their mulligan declarations by the time the player has the option
    // If the player performs the action, they then declare whether they will take a mulligan
    // TODO: 103.5c - Multiplayer and Brawl first mulligan
    // In a multiplayer game and in any Brawl game, the first mulligan a player takes doesn't count
    // toward the number of cards that player will put on the bottom of their library or
    // the number of mulligans that player may take
    // Subsequent mulligans are counted toward these numbers as normal
    // TODO: 103.5d - Shared team turns mulligans
    // In a multiplayer game using the shared team turns option, first each player on the starting team
    // declares whether that player will take a mulligan, then the players on each other team in turn order do the same
    // Teammates may consult while making their decisions
    // Then all mulligans are taken at the same time
    // A player may take a mulligan even after a teammate has decided to keep their opening hand
  });

  describe('103.6: Actions from opening hand', () => {
    // TODO: 103.6 - Actions from opening hand
    // Some cards allow a player to take actions with them from their opening hand
    // Once the mulligan process (see rule 103.5) is complete, the starting player may take any such actions in any order
    // Then each other player in turn order may do the same
    // TODO: 103.6a - Begin game with card on battlefield
    // If a card allows a player to begin the game with that card on the battlefield,
    // the player taking this action puts that card onto the battlefield
    // TODO: 103.6b - Reveal card from opening hand
    // If a card allows a player to reveal it from their opening hand, the player taking this action does so
    // The card remains revealed until the first turn begins
    // Each card may be revealed this way only once
    // TODO: 103.6c - Shared team turns opening hand actions
    // In a multiplayer game using the shared team turns option, first each player on the starting team,
    // in whatever order that team likes, may take such actions
    // Teammates may consult while making their decisions
    // Then each player on each other team in turn order does the same
  });

  describe('103.7: Planechase games', () => {
    // TODO: 103.7 - Planechase starting plane
    // In a Planechase game, the starting player moves the top card of their planar deck off that planar deck
    // and turns it face up. If it's a phenomenon card, the player puts that card on the bottom of their planar deck
    // and repeats this process until a plane card is turned face up
    // The face-up plane card becomes the starting plane
  });

  describe('103.8: Starting player takes first turn', () => {
    it('should have starting player take their first turn', () => {
      const { controller, playerIds } = createGame({
        players: [
          { name: 'Alice', deck: [{ definition: testCard, count: 1 }] },
          { name: 'Bob', deck: [{ definition: testCard, count: 1 }] },
        ],
      });

      const state = controller.getState();
      const [playerOne] = playerIds;

      expect(state.turn.activePlayerId).toBe(playerOne);
      expect(state.turn.turnNumber).toBe(1);
      expect(controller.getPlayerNeedingDecision()).toBe(playerOne);
      expect(state.players[playerOne].name).toBe('Alice');
    });

    describe('103.8a: Two-player game draw step skip', () => {
      it('should skip draw step for starting player in two-player game, but not for the second player', () => {
        const { controller, playerIds } = createGame({
          players: [
            { name: 'Alice', deck: [{ definition: testCard, count: 10 }] },
            { name: 'Bob', deck: [{ definition: testCard, count: 10 }] },
          ],
        });

        let state = controller.getState();
        const [playerOne, playerTwo] = playerIds;

        expect(state.turn.turnNumber).toBe(1);
        expect(state.turn.activePlayerId).toBe(playerOne);
        expect(state.players[playerOne].hand).toHaveLength(7);
        expect(state.players[playerOne].library).toHaveLength(3);
        expect(state.players[playerTwo].hand).toHaveLength(7);
        expect(state.players[playerTwo].library).toHaveLength(3);

        passUntilPhaseStep(controller, Phase.PRECOMBAT_MAIN, null, {
          activePlayerId: playerTwo,
        });

        state = controller.getState();
        expect(state.turn.turnNumber).toBe(1);
        expect(state.turn.activePlayerId).toBe(playerTwo);

        // Player 1 should still have 7 cards (didn't draw during their skipped draw step)
        expect(state.players[playerOne].hand).toHaveLength(7);
        expect(state.players[playerOne].library).toHaveLength(3);
        expect(state.players[playerTwo].hand).toHaveLength(8);
        expect(state.players[playerTwo].library).toHaveLength(2);

        passUntilPhaseStep(controller, Phase.PRECOMBAT_MAIN, null, {
          activePlayerId: playerOne,
        });

        state = controller.getState();
        expect(state.turn.turnNumber).toBe(2);
        expect(state.turn.activePlayerId).toBe(playerOne);
        expect(state.players[playerOne].hand).toHaveLength(8);
        expect(state.players[playerOne].library).toHaveLength(2);
        expect(state.players[playerTwo].hand).toHaveLength(8);
        expect(state.players[playerTwo].library).toHaveLength(2);
      });
    });

    // TODO: 103.8b - Two-Headed Giant draw step skip
    // In a Two-Headed Giant game, the team who plays first skips the draw step of their first turn

    describe('103.8c: No player skips their first draw step in other multiplayer formats', () => {
      it('should not skip the draw step for Commander', () => {
        const settings = createCommanderGame({
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
            {
              name: 'Charlie',
              commander: testCommander,
              deck: [{ definition: testCard, count: 1 }],
            },
            {
              name: 'Dave',
              commander: testCommander,
              deck: [{ definition: testCard, count: 1 }],
            },
          ],
        });

        const { controller, playerIds } = createGame(settings);
        const state = controller.getState();
        const [playerOne, playerTwo, playerThree, playerFour] = playerIds;
        expect(state.players[playerOne].hand).toHaveLength(1);
        expect(state.players[playerTwo].hand).toHaveLength(1);
        expect(state.players[playerThree].hand).toHaveLength(1);
        expect(state.players[playerFour].hand).toHaveLength(1);
      });
    });
  });
});
