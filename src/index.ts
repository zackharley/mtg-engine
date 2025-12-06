import { CardDefinition } from './core/card/card';
import { registerCardForPlayer } from './core/deck/deck';
import { ManaColor } from './core/costs/mana-costs';
import { createOrderedStack } from './core/primitives/ordered-stack';
import { makePlayerId, PlayerId, CardId, TargetId } from './core/primitives/id';
import { GameState } from './core/state/state';
import { reduce } from './core/state/reducer';
import { runGame } from './core/engine/engine';

type ManaPool = Record<ManaColor, number>;

export interface DeckEntry {
  definition: CardDefinition;
  count: number;
}

export interface PlayerSettings {
  id?: PlayerId;
  life?: number;
  deck: DeckEntry[];
}

export interface GameSettings {
  players: PlayerSettings[];
  startingLife?: number;
}

export type PlayerDecision =
  | { type: 'DRAW_CARD'; playerId: PlayerId }
  | {
      type: 'CAST_SPELL';
      playerId: PlayerId;
      cardId: CardId;
      targets: TargetId[];
    }
  | { type: 'PLAY_LAND'; playerId: PlayerId; cardId: CardId }
  | { type: 'TAP_PERMANENT_FOR_MANA'; playerId: PlayerId; cardId: CardId }
  | { type: 'ADVANCE_GAME' };

/**
 * Creates the initial immutable {@link GameState} for a match.
 * - Assigns player ids (re-using any provided).
 * - Seeds life totals and mana pools.
 * - Registers deck lists into each player's library.
 */
export function createGame(settings: GameSettings): {
  state: GameState;
  playerIds: PlayerId[];
} {
  const defaultLife = settings.startingLife ?? 20;
  const defaultManaPool = makeEmptyManaPool();

  let state: GameState = {
    players: {},
    cards: {},
    cardDefinitions: {},
    stack: createOrderedStack(),
    isKillSwitchTriggered: false,
  };

  const playerIds: PlayerId[] = [];

  for (const playerConfig of settings.players) {
    state = {
      ...state,
      players: { ...state.players },
    };

    const playerId = playerConfig.id ?? makePlayerId();
    playerIds.push(playerId);

    state.players[playerId] = {
      life: playerConfig.life ?? defaultLife,
      manaPool: { ...defaultManaPool },
      hand: [],
      battlefield: [],
      graveyard: createOrderedStack(),
      library: createOrderedStack(),
    };

    for (const entry of playerConfig.deck) {
      state = registerCardForPlayer(
        state,
        playerId,
        entry.definition,
        entry.count,
      );
    }
  }

  return { state, playerIds };
}

/**
 * Applies a player-facing decision to the game, translating it into core game actions.
 * Returns the next state plus any events emitted while processing the decision.
 */
export function applyPlayerDecision(
  state: GameState,
  decision: PlayerDecision,
): { state: GameState; events: ReturnType<typeof reduce>['events'] } {
  switch (decision.type) {
    case 'DRAW_CARD':
      return reduce(state, {
        type: 'DRAW_CARD',
        playerId: decision.playerId,
      });
    case 'CAST_SPELL': {
      return reduce(state, {
        type: 'CAST_SPELL',
        playerId: decision.playerId,
        cardId: decision.cardId,
        targets: decision.targets,
      });
    }
    case 'ADVANCE_GAME': {
      const result = runGame(state);
      return { state: result.finalState, events: result.events };
    }
    case 'PLAY_LAND':
      return reduce(state, {
        type: 'PLAY_LAND',
        playerId: decision.playerId,
        cardId: decision.cardId,
      });
    case 'TAP_PERMANENT_FOR_MANA':
      return reduce(state, {
        type: 'TAP_PERMANENT_FOR_MANA',
        playerId: decision.playerId,
        cardId: decision.cardId,
      });
    default:
      return { state, events: [] };
  }
}

function makeEmptyManaPool(): ManaPool {
  return {
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
  };
}
