import * as blessed from 'blessed';

import { formatCardShort } from '@/clients/tui/utils/card-formatter';
import type { CardId } from '@/core/primitives/id';
import type { GameState } from '@/core/state/state';

const SCROLL_PERCENTAGE_MULTIPLIER = 100;

interface KeyHandlerOptions {
  screen: blessed.Widgets.Screen;
  modal: blessed.Widgets.BoxElement;
  list: blessed.Widgets.BoxElement;
  cardIds: CardId[];
  state: GameState;
  resolve: (value: CardId | null) => void;
}

/**
 * Shows a modal for selecting a card from a list.
 * Returns the selected CardId or null if cancelled.
 */
export function selectCard(
  screen: blessed.Widgets.Screen,
  cardIds: CardId[],
  state: GameState,
  title: string,
): Promise<CardId | null> {
  return new Promise((resolve) => {
    if (cardIds.length === 0) {
      resolve(null);
      return;
    }

    // Create modal box
    const modal = createModal(screen, title);
    const list = createList(modal);

    // Handle input
    const handleKey = createKeyHandler({
      screen,
      modal,
      list,
      cardIds,
      state,
      resolve,
    });

    // Initialize display
    handleKey('', { name: 'init' });

    screen.once('keypress', handleKey);
    screen.render();
  });
}

function createKeyHandler(
  options: KeyHandlerOptions,
): (ch: string, key: { name: string }) => void {
  const { screen, modal, list, cardIds, state, resolve } = options;
  let selectedIndex = 0;

  const handler = (ch: string, key: { name: string }): void => {
    if (key.name === 'init') {
      updateListDisplay(list, cardIds, state, selectedIndex);
      return;
    }

    if (handleEscape(key, screen, modal, resolve)) {
      return;
    }

    const newIndex = handleNavigation({
      key,
      cardIds,
      list,
      state,
      currentIndex: selectedIndex,
      screen,
    });
    if (newIndex !== null) {
      selectedIndex = newIndex;
      return;
    }

    if (
      handleEnter({
        key,
        screen,
        modal,
        cardIds,
        selectedIndex,
        resolve,
      })
    ) {
      return;
    }

    handleNumericKey({ ch, cardIds, screen, modal, resolve });
  };

  return handler;
}

function handleEscape(
  key: { name: string },
  screen: blessed.Widgets.Screen,
  modal: blessed.Widgets.BoxElement,
  resolve: (value: CardId | null) => void,
): boolean {
  if (key.name !== 'escape') {
    return false;
  }
  screen.remove(modal);
  screen.render();
  resolve(null);
  return true;
}

interface NavigationOptions {
  key: { name: string };
  cardIds: CardId[];
  list: blessed.Widgets.BoxElement;
  state: GameState;
  currentIndex: number;
  screen: blessed.Widgets.Screen;
}

function handleNavigation(options: NavigationOptions): number | null {
  const { key, cardIds, list, state, currentIndex, screen } = options;
  if (key.name === 'up' || key.name === 'k') {
    const newIndex = Math.max(0, currentIndex - 1);
    updateListDisplay(list, cardIds, state, newIndex);
    screen.render();
    return newIndex;
  }
  if (key.name === 'down' || key.name === 'j') {
    const newIndex = Math.min(cardIds.length - 1, currentIndex + 1);
    updateListDisplay(list, cardIds, state, newIndex);
    screen.render();
    return newIndex;
  }
  return null;
}

interface EnterOptions {
  key: { name: string };
  screen: blessed.Widgets.Screen;
  modal: blessed.Widgets.BoxElement;
  cardIds: CardId[];
  selectedIndex: number;
  resolve: (value: CardId | null) => void;
}

function handleEnter(options: EnterOptions): boolean {
  const { key, screen, modal, cardIds, selectedIndex, resolve } = options;
  if (key.name !== 'enter' && key.name !== 'return') {
    return false;
  }
  screen.remove(modal);
  screen.render();
  resolve(cardIds[selectedIndex]);
  return true;
}

interface NumericKeyOptions {
  ch: string;
  cardIds: CardId[];
  screen: blessed.Widgets.Screen;
  modal: blessed.Widgets.BoxElement;
  resolve: (value: CardId | null) => void;
}

function handleNumericKey(options: NumericKeyOptions): void {
  const { ch, cardIds, screen, modal, resolve } = options;
  const num = parseInt(ch, 10);
  if (!isNaN(num) && num >= 1 && num <= cardIds.length) {
    screen.remove(modal);
    screen.render();
    resolve(cardIds[num - 1]);
  }
}

function createModal(
  screen: blessed.Widgets.Screen,
  title: string,
): blessed.Widgets.BoxElement {
  const modal = blessed.box({
    top: 'center',
    left: 'center',
    width: '60%',
    height: '70%',
    content: '',
    tags: true,
    border: { type: 'line' },
    label: ` ${title} `,
    keys: true,
    vi: true,
  });

  screen.append(modal);
  return modal;
}

function createList(
  modal: blessed.Widgets.BoxElement,
): blessed.Widgets.BoxElement {
  const list = blessed.box({
    top: 1,
    left: 1,
    width: '100%-2',
    height: '100%-2',
    content: '',
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
  });

  modal.append(list);
  return list;
}

function updateListDisplay(
  list: blessed.Widgets.BoxElement,
  cardIds: CardId[],
  _state: GameState,
  selectedIndex: number,
): void {
  const lines = cardIds.map((cardId, index) => {
    const cardShort = formatCardShort(cardId, _state);
    if (index === selectedIndex) {
      return `{green-fg}{bold}→ ${index + 1}. ${cardShort}{/bold}{/green-fg}`;
    }
    return `  ${index + 1}. ${cardShort}`;
  });

  list.setContent(lines.join('\n'));
  list.setScrollPerc(
    (selectedIndex / cardIds.length) * SCROLL_PERCENTAGE_MULTIPLIER,
  );
}
