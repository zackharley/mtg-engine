import { CardDefinition } from './core/card/card';
import { registerCardForPlayer } from './core/deck/deck';
import { ManaColor } from './core/costs/mana-costs';
import { createOrderedStack } from './core/primitives/ordered-stack';
import { makePlayerId, PlayerId, makeCardId } from './core/primitives/id';
import { GameState } from './core/state/state';
import {
  createGameController,
  GameController,
} from './core/engine/game-controller';
import { createInitialTurnState } from './core/turn/turn-state';
import { Phase, Step } from './core/turn/turn-structure';
import { produce } from 'immer';

const DEFAULT_STARTING_LIFE = 20;

type ManaPool = Record<ManaColor, number>;

export interface DeckEntry {
  definition: CardDefinition;
  count: number;
}

export interface PlayerSettings {
  id?: PlayerId;
  name?: string;
  life?: number;
  deck: DeckEntry[];
  commander?: CardDefinition;
}

export interface GameSettings {
  players: PlayerSettings[];
  startingLife?: number;
}

// Re-export types for convenience
export type { PlayerDecision } from './core/engine/game-controller';
export type { GameController } from './core/engine/game-controller';

// Re-export game modes
export { commanderGameMode, createCommanderGame } from './core/game-modes';
export type { GameMode } from './core/game-modes';

/**
 * Creates a new game and returns a GameController that manages the game loop.
 * The game loop starts automatically and will pause when a player decision is needed.
 *
 * - Assigns player ids (re-using any provided).
 * - Seeds life totals and mana pools.
 * - Registers deck lists into each player's library.
 * - Starts the game loop automatically.
 */
export function createGame(settings: GameSettings): {
  controller: GameController;
  playerIds: PlayerId[];
} {
  const defaultLife = settings.startingLife ?? DEFAULT_STARTING_LIFE;
  const defaultManaPool = makeEmptyManaPool();

  let state: GameState = {
    players: {},
    cards: {},
    cardDefinitions: {},
    stack: createOrderedStack(),
    turn: {
      activePlayerId: '' as PlayerId, // Will be set after first player is created
      phase: Phase.BEGINNING,
      step: Step.UNTAP,
      turnNumber: 1,
      landPlayedThisTurn: 0,
    },
    gameEnded: false,
    playersWhoPassedPriority: new Set(),
  };

  const { state: updatedState, playerIds } = initializePlayers(
    state,
    settings.players,
    defaultLife,
    defaultManaPool,
  );
  state = updatedState;

  // Initialize turn state with first player as starting player
  if (playerIds.length > 0) {
    state = {
      ...state,
      turn: createInitialTurnState(playerIds[0]),
    };
  }

  const controller = createGameController(state);
  return {
    controller,
    playerIds,
  };
}

/**
 * Initializes players in the game state, creating player records and registering their decks.
 * Returns the updated state and array of player IDs.
 */
function initializePlayers(
  state: GameState,
  playerConfigs: PlayerSettings[],
  defaultLife: number,
  defaultManaPool: ManaPool,
): {
  state: GameState;
  playerIds: PlayerId[];
} {
  return playerConfigs.reduce(
    (acc, playerConfig, index) => {
      const updatedState = {
        ...acc.state,
        players: { ...acc.state.players },
      };

      const playerId = playerConfig.id ?? makePlayerId();
      const playerIds = [...acc.playerIds, playerId];
      const playerName = playerConfig.name ?? `Player ${index + 1}`;

      updatedState.players[playerId] = {
        name: playerName,
        life: playerConfig.life ?? defaultLife,
        manaPool: { ...defaultManaPool },
        hand: [],
        battlefield: [],
        graveyard: createOrderedStack(),
        library: createOrderedStack(),
        commandZone: [],
      };

      // Register commander in command zone if present
      let stateWithCommander = updatedState;
      if (playerConfig.commander) {
        stateWithCommander = registerCommanderInCommandZone(
          updatedState,
          playerId,
          playerConfig.commander,
        );
      }

      // Register deck cards (excluding commander if it was in the deck)
      const stateWithDeck = playerConfig.deck.reduce((currentState, entry) => {
        // Skip commander if it's in the deck list (it's already in command zone)
        if (
          playerConfig.commander &&
          entry.definition.id === playerConfig.commander.id
        ) {
          return currentState;
        }
        return registerCardForPlayer(
          currentState,
          playerId,
          entry.definition,
          entry.count,
        );
      }, stateWithCommander);

      return { state: stateWithDeck, playerIds };
    },
    {
      state,
      playerIds: [] as PlayerId[],
    },
  );
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

/**
 * Registers a commander card in a player's command zone.
 * Based on rule 903.6: At the start of the game, each player puts their commander
 * from their deck face up into the command zone.
 *
 * @param state - The current game state
 * @param playerId - The player who owns the commander
 * @param commanderDefinition - The commander card definition
 * @returns Updated game state with commander in command zone
 */
function registerCommanderInCommandZone(
  state: GameState,
  playerId: PlayerId,
  commanderDefinition: CardDefinition,
): GameState {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(`Player ${playerId} not found in game state`);
  }

  return produce(state, (draft) => {
    // Register the card definition
    draft.cardDefinitions[commanderDefinition.id] = commanderDefinition;

    // Create a single card instance for the commander
    const commanderCardId = makeCardId();
    draft.cards[commanderCardId] = {
      id: commanderCardId,
      definitionId: commanderDefinition.id,
      controllerId: playerId,
      tapped: false,
    };

    // Add commander to command zone
    const playerDraft = draft.players[playerId];
    playerDraft.commandZone.push(commanderCardId);
  });
}
