import mountain from '../../../src/card-definitions/mountain/card';
import { createGame } from '../../../src';

describe('Play Mountain and tap for mana', () => {
  it('moves Mountain to the battlefield tapped and adds one red mana', () => {
    const { controller, playerIds } = createGame({
      players: [
        {
          deck: [{ definition: mountain, count: 1 }],
        },
      ],
    });

    const playerId = playerIds[0];

    // Wait for decision request and draw Mountain
    // The game loop should request a decision immediately after starting
    if (controller.isWaitingForDecision()) {
      const availableDecisions = controller.getAvailableDecisions();
      const drawDecision = availableDecisions.find(
        (d) => d.type === 'DRAW_CARD',
      );
      if (drawDecision) {
        controller.provideDecision(drawDecision);
      } else {
        // If DRAW_CARD isn't available, pass and wait for next decision
        controller.provideDecision({ type: 'PASS' });
      }
    }

    // Wait for next decision if needed, then get the card ID from hand
    while (
      controller.isWaitingForDecision() &&
      controller.getState().players[playerId].hand.length === 0
    ) {
      const availableDecisions = controller.getAvailableDecisions();
      const drawDecision = availableDecisions.find(
        (d) => d.type === 'DRAW_CARD',
      );
      if (drawDecision) {
        controller.provideDecision(drawDecision);
      } else {
        controller.provideDecision({ type: 'PASS' });
      }
    }

    const state = controller.getState();
    const mountainCardId = state.players[playerId].hand[0];
    expect(mountainCardId).toBeDefined();

    // Wait for decision request and play Mountain
    while (controller.isWaitingForDecision()) {
      const availableDecisions = controller.getAvailableDecisions();
      const playLandDecision = availableDecisions.find(
        (d) => d.type === 'PLAY_LAND' && d.cardId === mountainCardId,
      );
      if (playLandDecision) {
        controller.provideDecision(playLandDecision);
        break;
      } else {
        controller.provideDecision({ type: 'PASS' });
      }
    }

    // Wait for decision request and tap for mana
    while (controller.isWaitingForDecision()) {
      const availableDecisions = controller.getAvailableDecisions();
      const tapDecision = availableDecisions.find(
        (d) =>
          d.type === 'TAP_PERMANENT_FOR_MANA' && d.cardId === mountainCardId,
      );
      if (tapDecision) {
        controller.provideDecision(tapDecision);
        break;
      } else {
        controller.provideDecision({ type: 'PASS' });
      }
    }

    // Verify final state
    const finalState = controller.getState();
    expect(finalState.players[playerId].battlefield).toContain(mountainCardId);
    const card = finalState.cards[mountainCardId];
    expect(card).toBeDefined();
    expect(card?.tapped).toBe(true);
    expect(finalState.players[playerId].manaPool.R).toBe(1);

    // Verify events
    const events = controller.getEvents();
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'MANA_ADDED',
          playerId,
          color: 'R',
          amount: 1,
        }),
      ]),
    );
  });
});
