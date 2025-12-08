import type blessed from 'blessed';

import { formatHand } from '@/clients/shared/game-state-renderer';
import type { PlayerId } from '@/core/primitives/id';
import type { AvailablePlayerDecision } from '@/core/state/reducer';
import type { GameState } from '@/core/state/state';

/**
 * Updates the hand panel with current player's hand.
 */
export function updateHandPanel(
  panel: blessed.Widgets.BoxElement,
  state: GameState,
  playerId: PlayerId,
  availableDecisions: AvailablePlayerDecision[],
): void {
  const player = state.players[playerId];
  if (!player) {
    panel.setContent('(No player selected)');
    panel.screen?.render();
    return;
  }

  const handFormatted = formatHand(player.hand, state);

  // Highlight cards that can be played/cast
  const playableCardIds = new Set(
    availableDecisions
      .filter((d) => d.type === 'CAST_SPELL' || d.type === 'PLAY_LAND')
      .map((d) => d.cardId),
  );

  const content = handFormatted
    .map((line, index) => {
      const cardId = player.hand[index];
      if (cardId && playableCardIds.has(cardId)) {
        return `{green-fg}${line}{/green-fg}`;
      }
      return line;
    })
    .join('\n');

  panel.setContent(content || '(Hand is empty)');
  panel.screen?.render();
}
