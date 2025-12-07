import { defineCard } from './core/card/card';
import { parseManaCost } from './core/costs/mana-costs';
import { createGame } from './index';

const testCard = defineCard({
  scryfallId: 'test-card-harness',
  name: 'Harness Dummy',
  type: 'instant',
  manaCost: parseManaCost('{R}'),
  abilities: [],
});

describe('game harness', () => {
  it('builds an initial game state from player settings', () => {
    const { controller, playerIds } = createGame({
      startingLife: 25,
      players: [
        { name: 'Alice', life: 22, deck: [{ definition: testCard, count: 2 }] },
        { name: 'Bob', deck: [{ definition: testCard, count: 1 }] },
      ],
    });

    expect(playerIds).toHaveLength(2);

    const state = controller.getState();

    expect(controller.isWaitingForDecision()).toBe(true);
    const [playerOne, playerTwo] = playerIds;
    expect(state.players[playerOne].life).toBe(22);
    expect(state.players[playerTwo].life).toBe(25);
    expect(state.players[playerOne].manaPool.R).toBe(0);
    expect(state.players[playerTwo].manaPool.R).toBe(0);

    expect(state.players[playerOne].hand).toHaveLength(2);
    expect(state.players[playerOne].library).toHaveLength(0);
    expect(state.players[playerTwo].hand).toHaveLength(1);
    expect(state.players[playerTwo].library).toHaveLength(0);

    expect(state.cardDefinitions[testCard.id]).toBeDefined();

    // Verify turn state is initialized
    expect(state.turn.activePlayerId).toBe(playerOne);
    expect(state.turn.turnNumber).toBe(1);
    expect(state.turn.landPlayedThisTurn).toBe(0);

    expect(state.playersWhoPassedPriority.size).toBe(0);
  });
});
