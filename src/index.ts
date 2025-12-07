import { produce } from 'immer';

import type { CardDefinition } from './core/card/card';
import type { ManaColor } from './core/costs/mana-costs';
import {
  drawInitialHand,
  registerCardForPlayer,
  shuffleLibrary,
} from './core/deck/deck';
import type { GameController } from './core/engine/game-controller';
import { createGameController } from './core/engine/game-controller';
import type { PlayerId } from './core/primitives/id';
import { makeCardId, makePlayerId } from './core/primitives/id';
import { createOrderedStack } from './core/primitives/ordered-stack';
import { createSeededRng } from './core/random/random';
import type { GameState } from './core/state/state';
import { createInitialTurnState } from './core/turn/turn-state';
import { Phase, Step } from './core/turn/turn-structure';

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
  seed?: string;
}

// Re-export types for convenience
export type { PlayerDecision } from './core/engine/game-controller';
export type { GameController } from './core/engine/game-controller';

// Re-export game modes
export {
  commanderGameMode,
  createCommanderGame,
} from './core/game-modes/commander';
export type { GameMode } from './core/game-modes/types';

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
      startingPlayerId: '' as PlayerId, // Will be set after first player is created
      phase: Phase.BEGINNING,
      step: Step.UNTAP,
      turnNumber: 1,
      landPlayedThisTurn: 0,
    },
    gameEnded: false,
    playersWhoPassedPriority: new Set(),
    rng: createSeededRng(settings.seed),
  };

  const { state: updatedState, playerIds } = initializePlayers(
    state,
    settings.players,
    defaultLife,
    defaultManaPool,
  );
  state = updatedState;

  // Rule 103.3 - Shuffle decks
  // Each player shuffles their deck so that the cards are in a random order.
  // Each player may then shuffle or cut their opponents' decks.
  state = shuffleAllLibraries(state, playerIds);

  // Rule 103.5 - Draw initial hands
  // Each player draws a number of cards equal to their starting hand size, which is normally seven.
  state = drawInitialHands(state, playerIds);

  // TODO: Rule 103.5 - Mulligan process
  // A player who is dissatisfied with their initial hand may take a mulligan.
  // First, the starting player declares whether they will take a mulligan.
  // Then each other player in turn order does the same.
  // Once each player has made a declaration, all players who decided to take mulligans do so at the same time.
  // This process is then repeated until no player takes a mulligan.
  // For now, we skip the mulligan process and proceed directly to the first turn.

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

type PlayerState = GameState['players'][PlayerId];

/**
 * Initializes players in the game state, creating player records and registering their decks.
 * Returns the updated state and array of player IDs.
 */
function createPlayerState(
  playerConfig: PlayerSettings,
  index: number,
  defaultLife: number,
  defaultManaPool: ManaPool,
): { playerId: PlayerId; playerState: PlayerState } {
  const playerId = playerConfig.id ?? makePlayerId();
  const playerName = playerConfig.name ?? `Player ${index + 1}`;

  const playerState: PlayerState = {
    name: playerName,
    life: playerConfig.life ?? defaultLife,
    manaPool: { ...defaultManaPool },
    hand: [],
    battlefield: [],
    graveyard: createOrderedStack(),
    library: createOrderedStack(),
    commandZone: [],
  };

  return { playerId, playerState };
}

function registerPlayerDeck(
  state: GameState,
  playerId: PlayerId,
  deck: DeckEntry[],
  commander: CardDefinition | undefined,
): GameState {
  return deck.reduce((currentState, entry) => {
    if (commander && entry.definition.id === commander.id) {
      return currentState;
    }
    return registerCardForPlayer(
      currentState,
      playerId,
      entry.definition,
      entry.count,
    );
  }, state);
}

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
      const { playerId, playerState } = createPlayerState(
        playerConfig,
        index,
        defaultLife,
        defaultManaPool,
      );

      const updatedState = {
        ...acc.state,
        players: { ...acc.state.players, [playerId]: playerState },
      };

      const stateWithCommander = playerConfig.commander
        ? registerCommanderInCommandZone(
            updatedState,
            playerId,
            playerConfig.commander,
          )
        : updatedState;

      const stateWithDeck = registerPlayerDeck(
        stateWithCommander,
        playerId,
        playerConfig.deck,
        playerConfig.commander,
      );

      return {
        state: stateWithDeck,
        playerIds: [...acc.playerIds, playerId],
      };
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
 * Shuffles all players' libraries after deck registration.
 * Based on rule 103.3: Each player shuffles their deck so that the cards are in a random order.
 *
 * @param state - The current game state
 * @param playerIds - Array of player IDs whose libraries should be shuffled
 * @returns Updated game state with shuffled libraries
 */
function shuffleAllLibraries(
  state: GameState,
  playerIds: PlayerId[],
): GameState {
  return playerIds.reduce<GameState>((currentState, playerId) => {
    return shuffleLibrary(currentState, playerId);
  }, state);
}

const DEFAULT_STARTING_HAND_SIZE = 7;

/**
 * Draws initial hands for all players during game setup.
 * Based on rule 103.5: Each player draws a number of cards equal to their starting hand size,
 * which is normally seven.
 *
 * @param state - The current game state
 * @param playerIds - Array of player IDs to draw initial hands for
 * @returns Updated game state with initial hands drawn
 */
function drawInitialHands(state: GameState, playerIds: PlayerId[]): GameState {
  // Draw initial hands for all players
  // Rule 103.5: Each player draws a number of cards equal to their starting hand size
  return playerIds.reduce<GameState>((currentState, playerId) => {
    return drawInitialHand(currentState, playerId, DEFAULT_STARTING_HAND_SIZE);
  }, state);
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
