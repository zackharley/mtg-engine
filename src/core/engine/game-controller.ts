import { GameState } from '../state/state';
import { reduce, GameEvent, AvailablePlayerDecision } from '../state/reducer';
import { PlayerId, CardId, TargetId } from '../primitives/id';
import { runGame } from './engine';
import { getAvailableDecisions } from '../decisions/available-decisions';
import { markPlayerPassedPriority } from '../priority/priortity';

export type PlayerDecision =
  | { type: 'DRAW_CARD' }
  | { type: 'CAST_SPELL'; cardId: CardId; targets?: TargetId[] }
  | { type: 'PLAY_LAND'; cardId: CardId }
  | { type: 'TAP_PERMANENT_FOR_MANA'; cardId: CardId }
  | { type: 'PASS' }
  | { type: 'PASS_PRIORITY' }
  | { type: 'END_GAME' };

export interface GameController {
  getState(): GameState;
  getEvents(): GameEvent[];
  isWaitingForDecision(): boolean;
  getPlayerNeedingDecision(): PlayerId | undefined;
  getAvailableDecisions(): AvailablePlayerDecision[];
  provideDecision(decision: PlayerDecision): void;
  onEvents(callback: (events: GameEvent[], state: GameState) => void): void;
}

type EventCallback = (events: GameEvent[], state: GameState) => void;

export function createGameController(initialState: GameState): GameController {
  let state = initialState;
  const allEvents: GameEvent[] = [];
  const eventCallbacks: EventCallback[] = [];
  let pendingDecision: {
    playerId: PlayerId;
    availableDecisions: AvailablePlayerDecision[];
  } | null = null;

  // Convert player decision to game action
  function decisionToAction(
    decision: PlayerDecision,
    playerId: PlayerId,
  ): ReturnType<typeof reduce> | null {
    switch (decision.type) {
      case 'DRAW_CARD':
        return reduce(state, { type: 'DRAW_CARD', playerId });
      case 'CAST_SPELL':
        return reduce(state, {
          type: 'CAST_SPELL',
          playerId,
          cardId: decision.cardId,
          targets: decision.targets,
        });
      case 'PLAY_LAND':
        return reduce(state, {
          type: 'PLAY_LAND',
          playerId,
          cardId: decision.cardId,
        });
      case 'TAP_PERMANENT_FOR_MANA':
        return reduce(state, {
          type: 'TAP_PERMANENT_FOR_MANA',
          playerId,
          cardId: decision.cardId,
        });
      case 'PASS': {
        // Mark player as having passed priority
        const updatedState = markPlayerPassedPriority(state, playerId);
        return {
          state: updatedState,
          events: [],
        };
      }
      case 'PASS_PRIORITY': {
        // Mark player as having passed priority
        const updatedState = markPlayerPassedPriority(state, playerId);
        return {
          state: updatedState,
          events: [],
        };
      }
      case 'END_GAME': {
        // End game decision - set gameEnded flag to stop the game loop
        return {
          state: {
            ...state,
            gameEnded: true,
          },
          events: [],
        };
      }
    }
  }

  // Process events and notify callbacks
  function processEvents(events: GameEvent[], newState: GameState) {
    allEvents.push(...events);
    for (const callback of eventCallbacks) {
      callback(events, newState);
    }
  }

  // Run the game loop
  function continueGameLoop(startState: GameState) {
    const result = runGame(startState, (evts, s) => {
      processEvents(evts, s);
    });

    state = result.finalState;

    if (result.needsPlayerDecision && result.playerIdNeedingDecision) {
      // Find the decision request event (it should be the last one)
      const decisionEvent = result.events
        .slice()
        .reverse()
        .find((e) => e.type === 'PLAYER_DECISION_REQUESTED');
      if (decisionEvent && decisionEvent.type === 'PLAYER_DECISION_REQUESTED') {
        pendingDecision = {
          playerId: decisionEvent.playerId,
          availableDecisions: decisionEvent.availableDecisions,
        };
      } else {
        // Fallback: use the playerId from the result
        const availableDecisions = getAvailableDecisions(
          state,
          result.playerIdNeedingDecision,
        );
        pendingDecision = {
          playerId: result.playerIdNeedingDecision,
          availableDecisions,
        };
      }
    } else {
      pendingDecision = null;
    }
  }

  // Start the initial game loop
  continueGameLoop(state);

  return {
    getState() {
      return state;
    },

    getEvents() {
      return [...allEvents];
    },

    isWaitingForDecision() {
      return pendingDecision !== null;
    },

    getPlayerNeedingDecision() {
      return pendingDecision?.playerId;
    },

    getAvailableDecisions() {
      return pendingDecision?.availableDecisions ?? [];
    },

    provideDecision(decision: PlayerDecision) {
      if (!pendingDecision) {
        throw new Error('No decision is currently pending');
      }

      const playerId = pendingDecision.playerId;
      const actionResult = decisionToAction(decision, playerId);

      if (actionResult) {
        processEvents(actionResult.events, actionResult.state);
        state = actionResult.state; // Update state before continuing loop
        continueGameLoop(state);
      } else if (decision.type === 'PASS') {
        // For pass, just continue the loop with current state
        continueGameLoop(state);
      } else {
        continueGameLoop(state);
      }
    },

    onEvents(callback: EventCallback) {
      eventCallbacks.push(callback);
    },
  };
}
