import { Id } from '../id/id';
import { ManaColor } from '../costs/mana-costs';

export interface GameState {
  Players: Record<Id, PlayerState>;
}

interface PlayerState {
  id: Id;
  life: number;
  manaPool: Record<ManaColor, number>;
  hand: Id[];
  battlefield: Id[];
  graveyard: Id[];
  library: Id[];
}

export function isGameOver(state: GameState): boolean {
  const players = Object.values(state.Players);
  const alivePlayers = players.filter((player) => player.life > 0);
  if (alivePlayers.length === 1) {
    return true;
  }

  return false;
}
