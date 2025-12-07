import { merge } from 'lodash';

import type { Card } from '@/core/card/card';
import type { CardDefinition } from '@/core/card/card';
import { registerCardForPlayer } from '@/core/deck/deck';
import type { CardId, PlayerId } from '@/core/primitives/id';
import { makeCardDefinitionId, makePlayerId } from '@/core/primitives/id';
import {
  createOrderedStack,
  fromArrayOrderedStack,
} from '@/core/primitives/ordered-stack';
import { createSeededRng } from '@/core/random/random';
import type { GameEvent, ReduceContext } from '@/core/state/reducer';
import type { GameState, ZoneName } from '@/core/state/state';
import { createInitialTurnState } from '@/core/turn/turn-state';
import type { DeepPartial } from '@/lib/types';

/**
 * Creates a test player with default values.
 */
export function createTestPlayer(_playerId: PlayerId) {
  return {
    name: 'Test Player',
    life: 20,
    manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
    hand: [] as CardId[],
    battlefield: [] as CardId[],
    graveyard: createOrderedStack<CardId>(),
    library: createOrderedStack<CardId>(),
    commandZone: [] as CardId[],
  };
}

type TestPlayerState = ReturnType<typeof createTestPlayer>;

function createPlayersForTest(
  numPlayers: number,
  primaryPlayerId: PlayerId,
): Record<PlayerId, TestPlayerState> {
  const players: Record<PlayerId, TestPlayerState> = {};

  for (let i = 0; i < numPlayers; i++) {
    const playerId = i === 0 ? primaryPlayerId : makePlayerId();
    players[playerId] = createTestPlayer(playerId);
  }

  return players;
}

function mergeStateWithOverrides(
  defaultState: GameState,
  overrides: DeepPartial<GameState> | undefined,
): GameState {
  if (!overrides) {
    return defaultState;
  }

  if (overrides.players) {
    const { players: overriddenPlayers, ...restOverrides } = overrides;
    return {
      ...defaultState,
      ...restOverrides,
      players: overriddenPlayers as Record<PlayerId, TestPlayerState>,
    } as GameState;
  }

  return merge({}, defaultState, overrides);
}

/**
 * Creates a test card with default values.
 */
export function createTestCard(
  cardId: CardId,
  playerId: PlayerId,
  overrides?: Partial<Card>,
): Card {
  return {
    id: cardId,
    definitionId: makeCardDefinitionId(),
    controllerId: playerId,
    tapped: false,
    ...overrides,
  };
}

/**
 * Creates a test ReduceContext with default values.
 * Optionally accepts a playerId to use, or generates a new one.
 * By default, creates 2 players to avoid game ending immediately (isGameOver checks for <= 1 alive player).
 */
export function createTestContext(options?: {
  overrides?: DeepPartial<GameState>;
  playerId?: PlayerId;
  seed?: string;
  numPlayers?: number;
}): ReduceContext {
  const id = options?.playerId ?? makePlayerId();
  const numPlayers = options?.numPlayers ?? 2;
  const players = createPlayersForTest(numPlayers, id);

  const defaultState: GameState = {
    players,
    cards: {},
    cardDefinitions: {},
    stack: createOrderedStack(),
    turn: createInitialTurnState(id),
    gameEnded: false,
    playersWhoPassedPriority: new Set(),
    rng: createSeededRng(options?.seed),
  };

  const state = mergeStateWithOverrides(defaultState, options?.overrides);

  const events: GameEvent[] = [];
  return {
    state,
    events,
    emit(event: GameEvent) {
      events.push(event);
    },
  };
}

/**
 * Updates the state of an existing ReduceContext.
 * Useful for test setup when you need to modify state after context creation.
 */
export function updateContextState(
  ctx: ReduceContext,
  updater: (state: GameState) => GameState,
): void {
  ctx.state = updater(ctx.state);
}

/**
 * Checks if a card is in a specific zone for a player.
 */
export function cardIsInZone(
  state: GameState,
  cardId: CardId,
  playerId: PlayerId,
  zone: ZoneName,
): boolean {
  switch (zone) {
    case 'hand':
    case 'battlefield':
      return state.players[playerId][zone].includes(cardId);
    case 'graveyard':
    case 'library':
      return Array.from(state.players[playerId][zone]).includes(cardId);
    default:
      return false;
  }
}

/**
 * Creates a test context with a card in the player's hand.
 * Registers the card definition, creates a card instance, and moves it to hand.
 */
export function createContextWithCardInHand(
  playerId: PlayerId,
  cardDefinition: CardDefinition,
  options?: {
    manaPool?: { W: number; U: number; B: number; R: number; G: number };
    playersWhoPassedPriority?: Set<PlayerId>;
  },
): { ctx: ReduceContext; cardId: CardId } {
  return createContextWithCardInZone(playerId, cardDefinition, 'hand', options);
}

/**
 * Creates a test context with a card in the player's hand.
 * Registers the card definition, creates a card instance, and moves it to hand.
 */
export function createContextWithCardInZone(
  playerId: PlayerId,
  cardDefinition: CardDefinition,
  zone: ZoneName,
  options?: {
    manaPool?: { W: number; U: number; B: number; R: number; G: number };
    playersWhoPassedPriority?: Set<PlayerId>;
  },
): { ctx: ReduceContext; cardId: CardId } {
  const ctx = createTestContext({ playerId });
  updateContextState(ctx, (state) => {
    const updatedState = registerCardForPlayer(
      state,
      playerId,
      cardDefinition,
      1,
    );
    const cardId = Array.from(updatedState.players[playerId].library)[0];
    return merge({}, updatedState, {
      players: {
        [playerId]: {
          hand: [cardId],
          [zone]: [cardId],
          manaPool: options?.manaPool ?? { W: 0, U: 0, B: 0, R: 0, G: 0 },
        },
      },
      ...(options?.playersWhoPassedPriority && {
        playersWhoPassedPriority: options.playersWhoPassedPriority,
      }),
    });
  });
  const cardId = ctx.state.players[playerId].hand[0];
  return { ctx, cardId };
}

/**
 * Creates a test state with a card in the player's hand.
 * Registers the card definition, creates a card instance, and moves it to hand.
 * Returns the GameState directly (useful for tests that work with state, not context).
 */
export function createStateWithCardInHand(
  playerId: PlayerId,
  cardDefinition: CardDefinition,
  count = 1,
): { state: GameState; cardIds: CardId[] } {
  const ctx = createTestContext({ playerId });
  updateContextState(ctx, (state) => {
    const updatedState = registerCardForPlayer(
      state,
      playerId,
      cardDefinition,
      count,
    );
    const cardIds = Array.from(updatedState.players[playerId].library);
    return merge({}, updatedState, {
      players: {
        [playerId]: {
          hand: cardIds,
          library: createOrderedStack(),
        },
      },
    });
  });
  const cardIds = ctx.state.players[playerId].hand;
  return { state: ctx.state, cardIds };
}

/**
 * Creates a test state with a card in a specific zone.
 * Creates a minimal state with the card already in the specified zone.
 * Returns the GameState directly (useful for tests that work with state, not context).
 */
export function createStateWithCardInZone(
  cardId: CardId,
  playerId: PlayerId,
  zone: ZoneName,
): GameState {
  const ctx = createTestContext({ playerId, numPlayers: 2 });
  const card = createTestCard(cardId, playerId);

  const zoneValue =
    zone === 'hand' || zone === 'battlefield'
      ? [cardId]
      : zone === 'graveyard' || zone === 'library'
        ? fromArrayOrderedStack([cardId])
        : [];

  return merge({}, ctx.state, {
    cards: {
      [cardId]: card,
    },
    cardDefinitions: {
      [card.definitionId]: {
        id: card.definitionId,
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: { W: 0, U: 0, B: 0, R: 0, G: 0 },
        abilities: [],
      },
    },
    players: {
      [playerId]: {
        ...ctx.state.players[playerId],
        [zone]: zoneValue,
      },
    },
  });
}
