import type blessed from 'blessed';

import {
  formatManaPool,
  formatPlayerInfo,
  formatTurnInfo,
} from '@/clients/shared/game-state-renderer';
/**
 * Updates the game state panel with current game information.
 */
import type { PlayerId } from '@/core/primitives/id';
import type { GameState } from '@/core/state/state';

export function updateGameStatePanel(
  panel: blessed.Widgets.BoxElement,
  state: GameState,
): void {
  const turnInfo = formatTurnInfo(state.turn);
  const players = Object.entries(state.players).map(([playerId, player]) => {
    const playerInfo = formatPlayerInfo(player, playerId as PlayerId);
    const manaPool = formatManaPool(player.manaPool);
    return `${playerInfo} | Mana: ${manaPool}`;
  });

  const content = [turnInfo, '', ...players].join('\n');
  panel.setContent(content);
  panel.screen?.render();
}
