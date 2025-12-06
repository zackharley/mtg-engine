import { produce } from 'immer';
import { ManaColor } from './mana-costs';
import { GameState } from '../state/state';
import { PlayerId } from '../primitives/id';

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
