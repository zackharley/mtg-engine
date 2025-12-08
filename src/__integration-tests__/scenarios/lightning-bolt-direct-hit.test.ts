import lightningBolt from '@/card-definitions/cards/lightning-bolt/card';
import mountain from '@/card-definitions/cards/mountain/card';
import type { GameEvent } from '@/core/state/reducer';
import { createGame } from '@/index';

type IntegrationEvent =
  | { type: 'SPELL_CAST'; playerId: string; cardId: string; targets: string[] }
  | {
      type: 'DIRECT_DAMAGE_APPLIED';
      sourceCardId: string;
      controllerId: string;
      targetId: string;
      amount: number;
    }
  | { type: 'SPELL_RESOLVED'; playerId: string; cardId: string }
  | {
      type: 'CARD_MOVED';
      cardId: string;
      from: 'hand' | 'stack' | 'graveyard' | 'battlefield' | 'library';
      to: 'hand' | 'stack' | 'graveyard' | 'battlefield' | 'library';
    };

describe('Lightning Bolt direct hit', () => {
  it('lets player one cast Lightning Bolt at player two for 3 damage (CR 119.3)', () => {
    const { controller, playerIds } = createGame({
      players: [
        {
          deck: [
            { definition: lightningBolt, count: 1 },
            { definition: mountain, count: 1 },
          ],
        },
        {
          deck: [],
        },
      ],
    });

    const [playerOneId, playerTwoId] = playerIds;
    let state = controller.getState();

    // Verify initial state
    // Player one has 2 cards total, so initial hand is 2 (not 7)
    expect(state.players[playerOneId].hand).toHaveLength(2);
    expect(state.players[playerOneId].library).toHaveLength(0);
    expect(state.players[playerTwoId].hand).toHaveLength(0); // Empty deck
    expect(state.players[playerTwoId].library).toHaveLength(0);

    // Identify which card is which in player one's hand
    const hand = state.players[playerOneId].hand;
    expect(hand).toHaveLength(2);

    // Find Mountain and Lightning Bolt cards
    const mountainCardId = hand.find(
      (cardId) => state.cards[cardId].definitionId === mountain.id,
    );
    const lightningBoltCardId = hand.find(
      (cardId) => state.cards[cardId].definitionId === lightningBolt.id,
    );

    expect(mountainCardId).toBeDefined();
    expect(lightningBoltCardId).toBeDefined();

    // TypeScript narrowing - we've asserted they're defined
    if (!mountainCardId || !lightningBoltCardId) {
      throw new Error('Required cards not found in hand');
    }

    // Play Mountain
    expect(controller.isWaitingForDecision()).toBe(true);
    expect(controller.getPlayerNeedingDecision()).toBe(playerOneId);

    const availableDecisionsBeforeLand = controller.getAvailableDecisions();
    const playLandDecision = availableDecisionsBeforeLand.find(
      (d) => d.type === 'PLAY_LAND' && d.cardId === mountainCardId,
    );
    expect(playLandDecision).toBeDefined();

    controller.provideDecision({
      type: 'PLAY_LAND',
      cardId: mountainCardId,
    });

    // Verify Mountain is on battlefield
    state = controller.getState();
    expect(state.players[playerOneId].hand).not.toContain(mountainCardId);
    expect(state.players[playerOneId].battlefield).toContain(mountainCardId);
    expect(state.cards[mountainCardId].tapped).toBe(false);

    // Tap Mountain for mana
    expect(controller.isWaitingForDecision()).toBe(true);
    expect(controller.getPlayerNeedingDecision()).toBe(playerOneId);

    const availableDecisionsBeforeMana = controller.getAvailableDecisions();
    const tapForManaDecision = availableDecisionsBeforeMana.find(
      (d) => d.type === 'TAP_PERMANENT_FOR_MANA' && d.cardId === mountainCardId,
    );
    expect(tapForManaDecision).toBeDefined();

    controller.provideDecision({
      type: 'TAP_PERMANENT_FOR_MANA',
      cardId: mountainCardId,
    });

    // Verify Mountain is tapped and player has red mana
    state = controller.getState();
    expect(state.cards[mountainCardId].tapped).toBe(true);
    expect(state.players[playerOneId].manaPool.R).toBe(1);

    // Cast Lightning Bolt
    expect(controller.isWaitingForDecision()).toBe(true);
    expect(controller.getPlayerNeedingDecision()).toBe(playerOneId);

    const availableDecisionsBeforeCast = controller.getAvailableDecisions();
    const castSpellDecision = availableDecisionsBeforeCast.find(
      (d) => d.type === 'CAST_SPELL' && d.cardId === lightningBoltCardId,
    );
    expect(castSpellDecision).toBeDefined();

    controller.provideDecision({
      type: 'CAST_SPELL',
      cardId: lightningBoltCardId,
      targets: [playerTwoId],
    });

    // Verify Lightning Bolt is on stack and mana was spent
    state = controller.getState();
    expect(state.players[playerOneId].hand).not.toContain(lightningBoltCardId);
    expect(state.players[playerOneId].manaPool.R).toBe(0);
    expect(state.stack.length).toBeGreaterThan(0);

    // Pass priority to resolve the spell
    // Player one passes
    expect(controller.isWaitingForDecision()).toBe(true);
    expect(controller.getPlayerNeedingDecision()).toBe(playerOneId);
    controller.provideDecision({ type: 'PASS_PRIORITY' });

    // Player two passes (spell resolves)
    expect(controller.isWaitingForDecision()).toBe(true);
    expect(controller.getPlayerNeedingDecision()).toBe(playerTwoId);
    controller.provideDecision({ type: 'PASS_PRIORITY' });

    // Get final state and events
    const finalState = controller.getState();
    const allEvents = controller.getEvents();
    const integrationEvents = mapGameEventsToIntegrationEvents(allEvents);

    // Verify results
    expect(finalState.players[playerTwoId].life).toBe(17);
    expect(finalState.players[playerOneId].manaPool.R).toBe(0);
    expect(Array.from(finalState.players[playerOneId].graveyard)).toContain(
      lightningBoltCardId,
    );
    expect(finalState.players[playerOneId].hand).not.toContain(
      lightningBoltCardId,
    );

    expect(integrationEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'SPELL_CAST',
          playerId: playerOneId,
          cardId: lightningBoltCardId,
          targets: [playerTwoId],
        }),
        expect.objectContaining({
          type: 'DIRECT_DAMAGE_APPLIED',
          sourceCardId: lightningBoltCardId,
          controllerId: playerOneId,
          targetId: playerTwoId,
          amount: 3,
        }),
        expect.objectContaining({
          type: 'SPELL_RESOLVED',
          playerId: playerOneId,
          cardId: lightningBoltCardId,
        }),
        expect.objectContaining({
          type: 'CARD_MOVED',
          cardId: lightningBoltCardId,
          from: 'stack',
          to: 'graveyard',
        }),
      ]),
    );
  });
});

function mapGameEventsToIntegrationEvents(
  gameEvents: GameEvent[],
): IntegrationEvent[] {
  return gameEvents
    .map((event): IntegrationEvent | null => {
      switch (event.type) {
        case 'SPELL_CAST':
          return {
            type: 'SPELL_CAST',
            playerId: event.playerId,
            cardId: event.cardId,
            targets: event.targets ?? [],
          };
        case 'SPELL_RESOLVED':
          return {
            type: 'SPELL_RESOLVED',
            playerId: event.playerId,
            cardId: event.cardId,
          };
        case 'CARD_MOVED':
          return {
            type: 'CARD_MOVED',
            cardId: event.cardId,
            from: event.from,
            to: event.to,
          };
        case 'DIRECT_DAMAGE_APPLIED':
          return {
            type: 'DIRECT_DAMAGE_APPLIED',
            sourceCardId: event.sourceCardId,
            controllerId: event.controllerId,
            targetId: event.targetId,
            amount: event.amount,
          };
        default:
          return null;
      }
    })
    .filter((event): event is IntegrationEvent => event !== null);
}
