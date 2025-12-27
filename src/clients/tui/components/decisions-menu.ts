import type blessed from 'blessed';

import { formatCardShort } from '@/clients/tui/utils/card-formatter';
import type { AvailablePlayerDecision } from '@/core/state/reducer';
import type { GameState } from '@/core/state/state';

/**
 * Updates the decisions menu with available decisions.
 */
export function updateDecisionsMenu(
  panel: blessed.Widgets.BoxElement,
  availableDecisions: AvailablePlayerDecision[],
  state: GameState,
): void {
  if (availableDecisions.length === 0) {
    panel.setContent('(No decisions available)');
    panel.screen?.render();
    return;
  }

  const formatted = availableDecisions.map((decision, index) => {
    const number = index + 1;
    return formatDecision(decision, number, state);
  });

  const content = formatted.join('\n');
  panel.setContent(content);
  panel.screen?.render();
}

/**
 * Formats a decision for display.
 */
function formatDecision(
  decision: AvailablePlayerDecision,
  number: number,
  state: GameState,
): string {
  switch (decision.type) {
    case 'CAST_SPELL': {
      const cardShort = formatCardShort(decision.cardId, state);
      const targetsStr =
        decision.targets && decision.targets.length > 0
          ? ` (targets: ${decision.targets.join(', ')})`
          : '';
      return `${number}. {green-fg}Cast {bold}${cardShort}{/bold}${targetsStr}{/green-fg}`;
    }
    case 'PLAY_LAND': {
      const cardShort = formatCardShort(decision.cardId, state);
      return `${number}. {green-fg}Play {bold}${cardShort}{/bold}{/green-fg}`;
    }
    case 'TAP_PERMANENT_FOR_MANA': {
      const cardShort = formatCardShort(decision.cardId, state);
      return `${number}. {yellow-fg}Tap {bold}${cardShort}{/bold} for mana{/yellow-fg}`;
    }
    case 'PASS_PRIORITY': {
      return `${number}. {gray-fg}Pass Priority{/gray-fg}`;
    }
    case 'END_GAME': {
      return `${number}. {red-fg}End Game{/red-fg}`;
    }
    default: {
      return `${number}. Unknown decision`;
    }
  }
}
