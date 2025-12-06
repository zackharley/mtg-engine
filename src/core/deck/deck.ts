import { produce, castDraft } from 'immer';
import { CardDefinition } from '../card/card';
import { PlayerId, makeCardId } from '../primitives/id';
import { GameState } from '../state/state';
import {
  popOrderedStack,
  isEmptyOrderedStack,
  pushOrderedStack,
} from '../primitives/ordered-stack';

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
