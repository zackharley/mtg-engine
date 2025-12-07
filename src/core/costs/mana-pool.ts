import { produce } from 'immer';

import type { PlayerId } from '../primitives/id';
import type { GameState } from '../state/state';
import type { ManaColor } from './mana-costs';

export function addMana(
  state: GameState,
  playerId: PlayerId,
  color: ManaColor,
  amount = 1,
): GameState {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(`Player ${playerId} not found in game state`);
  }

  return produce(state, (draft) => {
    draft.players[playerId].manaPool[color] += amount;
  });
}
