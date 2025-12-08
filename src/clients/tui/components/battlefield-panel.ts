import type blessed from 'blessed';

import { formatBattlefield } from '@/clients/shared/game-state-renderer';
import type { AvailablePlayerDecision } from '@/core/state/reducer';
import type { GameState } from '@/core/state/state';

/**
 * Updates the battlefield panel with all permanents.
 */
export function updateBattlefieldPanel(
  panel: blessed.Widgets.BoxElement,
  state: GameState,
  availableDecisions: AvailablePlayerDecision[],
): void {
  // Collect all permanents from all players
  const allPermanents: string[] = [];
  const tappableCardIds = new Set(
    availableDecisions
      .filter((d) => d.type === 'TAP_PERMANENT_FOR_MANA')
      .map((d) => d.cardId),
  );

  Object.entries(state.players).forEach(([_playerId, player]) => {
    if (player.battlefield.length > 0) {
      allPermanents.push(`\n{cyan-fg}${player.name}:{/cyan-fg}`);
      const battlefieldFormatted = formatBattlefield(player.battlefield, state);
      battlefieldFormatted.forEach((line, index) => {
        const cardId = player.battlefield[index];
        if (cardId && tappableCardIds.has(cardId)) {
          allPermanents.push(`  {green-fg}${line}{/green-fg}`);
        } else {
          allPermanents.push(`  ${line}`);
        }
      });
    }
  });

  const content =
    allPermanents.length > 0
      ? allPermanents.join('\n')
      : '(Battlefield is empty)';

  panel.setContent(content);
  panel.screen?.render();
}
