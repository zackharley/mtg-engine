import type { Draft} from 'immer';
import { castDraft,produce } from 'immer';

import type { CardId } from '../primitives/id';
import { pushOrderedStack } from '../primitives/ordered-stack';
import { pipe } from '../state/pipe';
import type { GameState, ZoneName } from '../state/state';

export function moveCard(
  state: GameState,
  cardId: CardId,
  from: ZoneName,
  to: ZoneName,
  position: 'top' | 'bottom' | number = 'top',
): GameState {
  return produce(state, (draft) => {
    pipe(
      draft,
      (d) => addCardToZoneDraft(d, cardId, to, position),
      (d) => removeCardFromZoneDraft(d, cardId, from),
    );
  });
}

export function addCardToZone(
  state: GameState,
  cardId: CardId,
  to: ZoneName,
  position: 'top' | 'bottom' | number = 'top',
): GameState {
  return produce(state, (draft) => {
    addCardToZoneDraft(draft, cardId, to, position);
  });
}

function addCardToZoneDraft(
  draft: Draft<GameState>,
  cardId: CardId,
  to: ZoneName,
  position: 'top' | 'bottom' | number = 'top',
): Draft<GameState> {
  const card = draft.cards[cardId];
  if (!card) {
    throw new Error(`Card ${cardId} not found`);
  }
  const player = draft.players[card.controllerId];
  switch (to) {
    case 'hand':
      player.hand.push(cardId);
      break;
    case 'battlefield':
      player.battlefield.push(cardId);
      break;
    case 'graveyard':
      player.graveyard = castDraft(pushOrderedStack(player.graveyard, cardId));
      break;
    case 'library':
      player.library = castDraft(pushOrderedStack(player.library, cardId));
      break;
    default:
      throw new Error(`Invalid zone ${to}`);
  }
  return draft;
}

export function removeCardFromZone(
  state: GameState,
  cardId: CardId,
  from: ZoneName,
): GameState {
  return produce(state, (draft) => {
    removeCardFromZoneDraft(draft, cardId, from);
  });
}

function removeCardFromZoneDraft(
  draft: Draft<GameState>,
  cardId: CardId,
  from: ZoneName,
): Draft<GameState> {
  const card = draft.cards[cardId];
  if (!card) {
    throw new Error(`Card ${cardId} not found`);
  }
  const player = draft.players[card.controllerId];
  switch (from) {
    case 'hand':
      player.hand = player.hand.filter((id) => id !== cardId);
      break;
    case 'battlefield':
      player.battlefield = player.battlefield.filter((id) => id !== cardId);
      break;
    case 'graveyard':
      player.graveyard = castDraft(
        removeFirstFromOrderedStack(player.graveyard, cardId),
      );
      break;
    case 'library':
      player.library = castDraft(
        removeFirstFromOrderedStack(player.library, cardId),
      );
      break;
    case 'stack':
      // TODO: Implement stack object removal
      // popOrderedStack(draft.stack, cardId);
      break;
    case 'exile':
      // TODO: Implement exile logic
      break;
    case 'command':
      // TODO: Implement command logic
      break;
    default:
      throw new Error(`Invalid zone ${from}`);
  }
  return draft;
}

function removeFirstFromOrderedStack(
  stack: readonly CardId[],
  cardId: CardId,
): readonly CardId[] {
  const idx = stack.findIndex((id) => id === cardId);
  if (idx === -1) {
    return stack;
  }
  return Object.freeze([...stack.slice(0, idx), ...stack.slice(idx + 1)]);
}
