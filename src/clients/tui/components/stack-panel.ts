import type blessed from 'blessed';

import { formatStack } from '@/clients/shared/game-state-renderer';
import type { GameState } from '@/core/state/state';

/**
 * Updates the stack panel with current stack contents.
 */
export function updateStackPanel(
  panel: blessed.Widgets.BoxElement,
  state: GameState,
): void {
  const stackFormatted = formatStack(state.stack, state);
  const content = stackFormatted.join('\n');
  panel.setContent(content);
  panel.screen?.render();
}
