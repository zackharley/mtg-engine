import { getAvailableDecisions } from '../actions/available-decisions';
import type { SpellAbility } from '../card/card';
import type { CardId, PlayerId, TargetId } from '../primitives/id';
import { markPlayerPassedPriority } from '../priority/priortity';
import type { AvailablePlayerDecision, GameEvent } from '../state/reducer';
import { makeContext, reduce } from '../state/reducer';
import type { GameState } from '../state/state';
import { processTurnBasedActions } from '../state/state';
import { getValidTargets } from '../targeting/get-valid-targets';
import { runGame } from './engine';

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
  getTargetingInfo(cardId: CardId): {
    validTargets: TargetId[];
    minTargets: number;
    maxTargets: number;
  } | null;
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
  function processEvents(events: GameEvent[], newState: GameState): void {
    allEvents.push(...events);
    eventCallbacks.forEach((callback) => {
      callback(events, newState);
    });
  }

  // Run the game loop
  function continueGameLoop(startState: GameState): void {
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
      if (decisionEvent?.type === 'PLAYER_DECISION_REQUESTED') {
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

  // Process turn-based actions for the initial step before starting the game loop
  // This ensures the initial step (e.g., UNTAP) is processed once when the game starts
  state = processTurnBasedActions(state);

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

    getTargetingInfo(cardId: CardId) {
      const card = state.cards[cardId];
      if (!card) {
        return null;
      }

      const definition = state.cardDefinitions[card.definitionId];
      if (!definition) {
        return null;
      }

      const spellAbility = definition.abilities.find(
        (a): a is SpellAbility => a.type === 'spell',
      );
      if (!spellAbility?.targets) {
        return null;
      }

      // Get the player who would be casting this spell
      // Use the player needing decision if available, otherwise use the card's controller
      const playerId = pendingDecision?.playerId ?? card.controllerId;

      // Get targeting requirements
      const ctx = makeContext(state);
      const targetRequirements = spellAbility.targets(ctx);

      // If no target requirements, return null
      if (targetRequirements.length === 0) {
        return null;
      }

      // For now, we assume spells have a single targeting requirement
      // Multi-target spells would need more complex logic
      const targetRequirement = targetRequirements[0];

      // Get valid targets using core targeting logic
      const validTargets = getValidTargets(state, spellAbility, playerId);

      return {
        validTargets,
        minTargets: targetRequirement.minTargets,
        maxTargets: targetRequirement.maxTargets,
      };
    },
  };
}
