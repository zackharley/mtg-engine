import lightningBolt from '../../../src/card-definitions/lightning-bolt/card';
import mountain from '../../../src/card-definitions/mountain/card';
import { CardDefinition } from '../../../src/core/card/card';
import { GameState } from '../../../src/core/state/state';
import {
  makePlayerId,
  PlayerId,
  CardId,
  TargetId,
} from '../../core/primitives/id';
import { GameEvent } from '../../../src/core/state/reducer';
import { createGame, applyPlayerDecision } from '../../../src';

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

type ScriptedAction =
  | { type: 'DRAW_CARD'; playerId: string }
  | {
      type: 'PLAY_LAND';
      playerId: string;
      cardId: string;
    }
  | {
    type: 'TAP_FOR_MANA';
    playerId: string;
    cardId: string;
  }
  | { type: 'CAST_SPELL'; casterId: string; cardId: string; targets: string[] }
  | { type: 'RESOLVE_STACK' };

interface ScenarioResult {
  finalState: GameState;
  events: IntegrationEvent[];
}

interface ScenarioInput {
  initialState: GameState;
  actions: ScriptedAction[];
  cardLibrary: Record<string, CardDefinition>;
}

describe('Lightning Bolt direct hit', () => {
  it('lets player one cast Lightning Bolt at player two for 3 damage (CR 119.3)', async () => {
    const playerOneId = makePlayerId();
    const playerTwoId = makePlayerId();

    let { state: initialState } = createGame({
      players: [
        {
          id: playerOneId,
          life: 20,
          deck: [
            { definition: lightningBolt, count: 1 },
            { definition: mountain, count: 1 },
          ],
        },
        {
          id: playerTwoId,
          life: 20,
          deck: [],
        },
      ],
    });

    // Draw Mountain then Lightning Bolt
    let drawOne = applyPlayerDecision(initialState, {
      type: 'DRAW_CARD',
      playerId: playerOneId,
    });
    initialState = drawOne.state;
    let drawTwo = applyPlayerDecision(initialState, {
      type: 'DRAW_CARD',
      playerId: playerOneId,
    });
    initialState = drawTwo.state;

    const [firstCard, secondCard] = initialState.players[playerOneId].hand;
    const mountainCardId = initialState.cards[firstCard].definitionId === mountain.id ? firstCard : secondCard;
    const lightningBoltCardId = mountainCardId === firstCard ? secondCard : firstCard;

    const result = await runScriptedScenario({
      initialState,
      cardLibrary: { [lightningBolt.id]: lightningBolt },
      actions: [
        { type: 'PLAY_LAND', playerId: playerOneId, cardId: mountainCardId },
        { type: 'TAP_FOR_MANA', playerId: playerOneId, cardId: mountainCardId },
        {
          type: 'CAST_SPELL',
          casterId: playerOneId,
          cardId: lightningBoltCardId,
          targets: [playerTwoId],
        },
        { type: 'RESOLVE_STACK' },
      ],
    });

    expect(result.finalState.players[playerTwoId].life).toBe(17);
    expect(result.finalState.players[playerOneId].manaPool.R).toBe(0);
    expect(
      Array.from(result.finalState.players[playerOneId].graveyard),
    ).toContain(lightningBoltCardId);
    expect(result.finalState.players[playerOneId].hand).not.toContain(
      lightningBoltCardId,
    );
    expect(result.events).toEqual(
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

async function runScriptedScenario(
  input: ScenarioInput,
): Promise<ScenarioResult> {
  let state = input.initialState;
  const allEvents: IntegrationEvent[] = [];

  // Process scripted player actions first
  for (const action of input.actions) {
    if (action.type === 'DRAW_CARD') {
      const result = applyPlayerDecision(state, {
        type: 'DRAW_CARD',
        playerId: action.playerId as PlayerId,
      });
      state = result.state;
    } else if (action.type === 'PLAY_LAND') {
      const result = applyPlayerDecision(state, {
        type: 'PLAY_LAND',
        playerId: action.playerId as PlayerId,
        cardId: action.cardId as CardId,
      });
      state = result.state;
    } else if (action.type === 'TAP_FOR_MANA') {
      const result = applyPlayerDecision(state, {
        type: 'TAP_PERMANENT_FOR_MANA',
        playerId: action.playerId as PlayerId,
        cardId: action.cardId as CardId,
      });
      state = result.state;
    } else if (action.type === 'CAST_SPELL') {
      const result = applyPlayerDecision(state, {
        type: 'CAST_SPELL',
        playerId: action.casterId as PlayerId,
        cardId: action.cardId as CardId,
        targets: action.targets as TargetId[],
      });
      state = result.state;
      allEvents.push(...mapGameEventsToIntegrationEvents(result.events));
    } else if (action.type === 'RESOLVE_STACK') {
      const engineResult = applyPlayerDecision(state, {
        type: 'ADVANCE_GAME',
      });
      state = engineResult.state;
      allEvents.push(...mapGameEventsToIntegrationEvents(engineResult.events));
    }
  }

  return {
    finalState: state,
    events: allEvents,
  };
}

function mapGameEventsToIntegrationEvents(
  gameEvents: GameEvent[],
): IntegrationEvent[] {
  const mapped: IntegrationEvent[] = [];

  for (const event of gameEvents) {
    switch (event.type) {
      case 'SPELL_CAST':
        mapped.push({
          type: 'SPELL_CAST',
          playerId: event.playerId as string,
          cardId: event.cardId as string,
          targets: (event.targets as string[]) ?? [],
        });
        break;
      case 'SPELL_RESOLVED':
        mapped.push({
          type: 'SPELL_RESOLVED',
          playerId: event.playerId as string,
          cardId: event.cardId as string,
        });
        break;
      case 'CARD_MOVED':
        mapped.push({
          type: 'CARD_MOVED',
          cardId: event.cardId as string,
          from: event.from,
          to: event.to,
        });
        break;
      case 'DIRECT_DAMAGE_APPLIED':
        mapped.push({
          type: 'DIRECT_DAMAGE_APPLIED',
          sourceCardId: event.sourceCardId as string,
          controllerId: event.controllerId as string,
          targetId: event.targetId as string,
          amount: event.amount,
        });
        break;
      // Skip events we don't have integration mappings for (e.g., LIFE_GAINED)
    }
  }

  return mapped;
}
