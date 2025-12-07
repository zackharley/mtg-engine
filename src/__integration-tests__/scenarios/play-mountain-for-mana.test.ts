import { createGame } from '../../../src';
import mountain from '../../../src/card-definitions/mountain/card';

describe('Play Mountain and tap for mana', () => {
  it('moves Mountain to the battlefield tapped and adds one red mana', () => {
    const { controller, playerIds } = createGame({
      players: [
        { deck: [{ definition: mountain, count: 1 }] },
        { deck: [] }, // Second player needed for game loop to work properly
      ],
    });

    const [playerOne] = playerIds;
    let state = controller.getState();

    expect(state.players[playerOne].hand).toHaveLength(1);
    expect(state.players[playerOne].battlefield).toHaveLength(0);
    expect(state.players[playerOne].manaPool.R).toBe(0);
    expect(state.players[playerOne].library).toHaveLength(0);

    expect(controller.isWaitingForDecision()).toBe(true);
    expect(controller.getPlayerNeedingDecision()).toBe(playerOne);

    const mountainCardId = state.players[playerOne].hand[0];
    const mountainCard = state.cards[mountainCardId];
    expect(mountainCard).toBeDefined();
    expect(state.cardDefinitions[mountainCard.definitionId].name).toBe(
      'Mountain',
    );

    // Play the land
    expect(controller.isWaitingForDecision()).toBe(true);
    const playLandDecision = controller
      .getAvailableDecisions()
      .find((d) => d.type === 'PLAY_LAND' && d.cardId === mountainCardId);
    expect(playLandDecision).toBeDefined();

    controller.provideDecision({ type: 'PLAY_LAND', cardId: mountainCardId });

    // Verify Mountain is on battlefield and not tapped
    state = controller.getState();
    expect(state.players[playerOne].hand).toHaveLength(0);
    expect(state.players[playerOne].battlefield).toHaveLength(1);
    expect(state.players[playerOne].battlefield[0]).toBe(mountainCardId);
    expect(state.cards[mountainCardId].tapped).toBe(false);

    // Tap Mountain for mana
    expect(controller.isWaitingForDecision()).toBe(true);
    const tapForManaDecision = controller
      .getAvailableDecisions()
      .find(
        (d) =>
          d.type === 'TAP_PERMANENT_FOR_MANA' && d.cardId === mountainCardId,
      );
    expect(tapForManaDecision).toBeDefined();

    controller.provideDecision({
      type: 'TAP_PERMANENT_FOR_MANA',
      cardId: mountainCardId,
    });

    // Verify Mountain is tapped and player has red mana
    state = controller.getState();
    expect(state.cards[mountainCardId].tapped).toBe(true);
    expect(state.players[playerOne].manaPool.R).toBe(1);
    expect(state.players[playerOne].battlefield).toContain(mountainCardId);
  });
});
