import { castDraft, produce } from 'immer';

import type { CardDefinition } from '../card/card';
import type { PlayerId } from '../primitives/id';
import { makeCardId } from '../primitives/id';
import {
  fromArrayOrderedStack,
  isEmptyOrderedStack,
  popOrderedStack,
  pushOrderedStack,
  toArrayOrderedStack,
} from '../primitives/ordered-stack';
import { shuffle } from '../random/random';
import type { GameState } from '../state/state';

/**
 * Registers card instances for a player's deck.
 * Creates unique Card instances from CardDefinitions and adds them to the player's library.
 * Multiple players can use the same CardDefinition, but each gets their own Card instances.
 *
 * @param state - The current game state
 * @param playerId - The player to register cards for
 * @param cardDefinition - The card definition to create instances from
 * @param count - Number of instances to create (default: 1)
 * @returns Updated game state with cards registered
 */
export function registerCardForPlayer(
  state: GameState,
  playerId: PlayerId,
  cardDefinition: CardDefinition,
  count = 1,
): GameState {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(`Player ${playerId} not found in game state`);
  }

  return produce(state, (draft) => {
    draft.cardDefinitions[cardDefinition.id] = cardDefinition;

    for (let i = 0; i < count; i++) {
      const cardId = makeCardId();
      draft.cards[cardId] = {
        id: cardId,
        definitionId: cardDefinition.id,
        controllerId: playerId,
        tapped: false,
      };
      const playerDraft = draft.players[playerId];
      playerDraft.library = castDraft(
        pushOrderedStack(playerDraft.library, cardId),
      );
    }
  });
}

/**
 * Draws a card from a player's library to their hand.
 * Removes the card from the library and adds it to the hand.
 *
 * @param state - The current game state
 * @param playerId - The player drawing the card
 * @returns Updated game state with card moved from library to hand
 */
export function drawCard(state: GameState, playerId: PlayerId): GameState {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(`Player ${playerId} not found in game state`);
  }

  if (isEmptyOrderedStack(player.library)) {
    throw new Error(`Player ${playerId} has no cards in library to draw`);
  }

  return produce(state, (draft) => {
    const playerDraft = draft.players[playerId];
    // Draw the top card using OrderedStack pop
    const [newLibrary, drawnCardId] = popOrderedStack(playerDraft.library);
    if (drawnCardId) {
      playerDraft.library = castDraft(newLibrary);
      playerDraft.hand.push(drawnCardId);
    }
  });
}

/**
 * Shuffles a player's library.
 * Based on rule 103.3 and 701.24a: Each player shuffles their deck so that the cards are in a random order.
 *
 * @param state - The current game state
 * @param playerId - The player whose library should be shuffled
 * @returns Updated game state with shuffled library
 */
export function shuffleLibrary(
  state: GameState,
  playerId: PlayerId,
): GameState {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(`Player ${playerId} not found in game state`);
  }

  return produce(state, (draft) => {
    const playerDraft = draft.players[playerId];
    // Convert OrderedStack to array, shuffle, then convert back
    const libraryArray = toArrayOrderedStack(playerDraft.library);
    const shuffledArray = shuffle(state.rng, libraryArray);
    playerDraft.library = castDraft(fromArrayOrderedStack(shuffledArray));
  });
}

/**
 * Draws a player's initial hand during game setup.
 * Based on rule 103.5: Each player draws a number of cards equal to their starting hand size,
 * which is normally seven.
 *
 * If the player's library doesn't have enough cards, draws as many as available.
 * This handles edge cases like test scenarios with very small decks.
 *
 * @param state - The current game state
 * @param playerId - The player drawing their initial hand
 * @param startingHandSize - Number of cards to draw (default: 7)
 * @returns Updated game state with cards drawn into player's hand
 */
export function drawInitialHand(
  state: GameState,
  playerId: PlayerId,
  startingHandSize = 7,
): GameState {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(`Player ${playerId} not found in game state`);
  }

  return produce(state, (draft) => {
    const playerDraft = draft.players[playerId];
    // Draw up to startingHandSize cards, stopping if library is empty
    for (let i = 0; i < startingHandSize; i++) {
      if (isEmptyOrderedStack(playerDraft.library)) {
        // Library is empty, stop drawing
        break;
      }
      const [newLibrary, drawnCardId] = popOrderedStack(playerDraft.library);
      if (drawnCardId) {
        playerDraft.library = castDraft(newLibrary);
        playerDraft.hand.push(drawnCardId);
      }
    }
  });
}
