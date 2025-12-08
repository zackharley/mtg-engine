import * as blessed from 'blessed';

import type { TargetId } from '@/core/primitives/id';
import type { GameState } from '@/core/state/state';

const SCROLL_PERCENTAGE_MULTIPLIER = 100;

export interface SelectTargetsOptions {
  validTargets: TargetId[];
  state: GameState;
  title: string;
  minTargets: number;
  maxTargets: number;
}

interface TargetSelectorContext {
  screen: blessed.Widgets.Screen;
  modal: blessed.Widgets.BoxElement;
  list: blessed.Widgets.BoxElement;
  validTargets: TargetId[];
  state: GameState;
  selected: Set<TargetId>;
  minTargets: number;
  maxTargets: number;
  resolve: (value: TargetId[] | null) => void;
}

interface TargetToggleOptions {
  targetId: TargetId;
  selected: Set<TargetId>;
  maxTargets: number;
  minTargets: number;
  screen: blessed.Widgets.Screen;
  modal: blessed.Widgets.BoxElement;
  list: blessed.Widgets.BoxElement;
  validTargets: TargetId[];
  state: GameState;
  selectedIndex: number;
  resolve: (value: TargetId[] | null) => void;
}

interface ListDisplayOptions {
  list: blessed.Widgets.BoxElement;
  validTargets: TargetId[];
  state: GameState;
  selectedIndex: number;
  selected: Set<TargetId>;
}

interface NavigationOptions {
  key: { name: string };
  validTargets: TargetId[];
  list: blessed.Widgets.BoxElement;
  state: GameState;
  currentIndex: number;
  selected: Set<TargetId>;
  screen: blessed.Widgets.Screen;
}

interface EnterOptions {
  key: { name: string };
  validTargets: TargetId[];
  selectedIndex: number;
  selected: Set<TargetId>;
  maxTargets: number;
  minTargets: number;
  screen: blessed.Widgets.Screen;
  modal: blessed.Widgets.BoxElement;
  list: blessed.Widgets.BoxElement;
  state: GameState;
  resolve: (value: TargetId[] | null) => void;
}

interface NumericKeyOptions {
  ch: string;
  validTargets: TargetId[];
  selected: Set<TargetId>;
  maxTargets: number;
  minTargets: number;
  screen: blessed.Widgets.Screen;
  modal: blessed.Widgets.BoxElement;
  list: blessed.Widgets.BoxElement;
  state: GameState;
  selectedIndex: number;
  resolve: (value: TargetId[] | null) => void;
}

interface ConfirmOptions {
  ch: string;
  selected: Set<TargetId>;
  minTargets: number;
  screen: blessed.Widgets.Screen;
  modal: blessed.Widgets.BoxElement;
  resolve: (value: TargetId[] | null) => void;
}

/**
 * Shows a modal for selecting targets for a spell.
 * Returns the selected TargetIds or null if cancelled.
 */
export function selectTargets(
  screen: blessed.Widgets.Screen,
  options: SelectTargetsOptions,
): Promise<TargetId[] | null> {
  const { validTargets, state, title, minTargets, maxTargets } = options;
  return new Promise((resolve) => {
    if (validTargets.length === 0) {
      resolve([]);
      return;
    }

    // Create modal box
    const modal = createModal(screen, title);
    const list = createList(modal);

    const selected = new Set<TargetId>();

    // Handle input
    const handleKey = createKeyHandler({
      screen,
      modal,
      list,
      validTargets,
      state,
      selected,
      minTargets,
      maxTargets,
      resolve,
    });

    // Initialize display
    handleKey('', { name: 'init' });

    screen.once('keypress', handleKey);
    screen.render();
  });
}

function createKeyHandler(
  context: TargetSelectorContext,
): (ch: string, key: { name: string }) => void {
  const {
    screen,
    modal,
    list,
    validTargets,
    state,
    selected,
    minTargets,
    maxTargets,
    resolve,
  } = context;
  let selectedIndex = 0;

  const handler = (ch: string, key: { name: string }): void => {
    if (key.name === 'init') {
      updateListDisplay({ list, validTargets, state, selectedIndex, selected });
      return;
    }

    if (handleEscape(key, screen, modal, resolve)) {
      return;
    }

    const navResult = handleNavigation({
      key,
      validTargets,
      list,
      state,
      currentIndex: selectedIndex,
      selected,
      screen,
    });
    if (navResult !== null) {
      selectedIndex = navResult;
      return;
    }

    if (
      handleEnter({
        key,
        validTargets,
        selectedIndex,
        selected,
        maxTargets,
        minTargets,
        screen,
        modal,
        list,
        state,
        resolve,
      })
    ) {
      return;
    }

    if (
      handleNumericKey({
        ch,
        validTargets,
        selected,
        maxTargets,
        minTargets,
        screen,
        modal,
        list,
        state,
        selectedIndex,
        resolve,
      })
    ) {
      return;
    }

    handleConfirm({ ch, selected, minTargets, screen, modal, resolve });
  };

  return handler;
}

function handleEscape(
  key: { name: string },
  screen: blessed.Widgets.Screen,
  modal: blessed.Widgets.BoxElement,
  resolve: (value: TargetId[] | null) => void,
): boolean {
  if (key.name !== 'escape') {
    return false;
  }
  screen.remove(modal);
  screen.render();
  resolve(null);
  return true;
}

function handleNavigation(options: NavigationOptions): number | null {
  const { key, validTargets, list, state, currentIndex, selected, screen } =
    options;
  if (key.name === 'up' || key.name === 'k') {
    const newIndex = Math.max(0, currentIndex - 1);
    updateListDisplay({
      list,
      validTargets,
      state,
      selectedIndex: newIndex,
      selected,
    });
    screen.render();
    return newIndex;
  }
  if (key.name === 'down' || key.name === 'j') {
    const newIndex = Math.min(validTargets.length - 1, currentIndex + 1);
    updateListDisplay({
      list,
      validTargets,
      state,
      selectedIndex: newIndex,
      selected,
    });
    screen.render();
    return newIndex;
  }
  return null;
}

function handleEnter(options: EnterOptions): boolean {
  const {
    key,
    validTargets,
    selectedIndex,
    selected,
    maxTargets,
    minTargets,
    screen,
    modal,
    list,
    state,
    resolve,
  } = options;
  if (key.name !== 'enter' && key.name !== 'return') {
    return false;
  }
  handleTargetToggle({
    targetId: validTargets[selectedIndex],
    selected,
    maxTargets,
    minTargets,
    screen,
    modal,
    list,
    validTargets,
    state,
    selectedIndex,
    resolve,
  });
  return true;
}

function handleNumericKey(options: NumericKeyOptions): boolean {
  const {
    ch,
    validTargets,
    selected,
    maxTargets,
    minTargets,
    screen,
    modal,
    list,
    state,
    selectedIndex,
    resolve,
  } = options;
  const num = parseInt(ch, 10);
  if (isNaN(num) || num < 1 || num > validTargets.length) {
    return false;
  }
  handleTargetToggle({
    targetId: validTargets[num - 1],
    selected,
    maxTargets,
    minTargets,
    screen,
    modal,
    list,
    validTargets,
    state,
    selectedIndex,
    resolve,
  });
  return true;
}

function handleConfirm(options: ConfirmOptions): void {
  const { ch, selected, minTargets, screen, modal, resolve } = options;
  if (ch === 'c' || ch === 'C') {
    if (selected.size >= minTargets) {
      screen.remove(modal);
      screen.render();
      resolve(Array.from(selected));
    }
  }
}

function handleTargetToggle(options: TargetToggleOptions): void {
  const {
    targetId,
    selected,
    maxTargets,
    minTargets,
    screen,
    modal,
    list,
    validTargets,
    state,
    selectedIndex,
    resolve,
  } = options;

  if (selected.has(targetId)) {
    selected.delete(targetId);
  } else if (selected.size < maxTargets) {
    selected.add(targetId);
  }
  updateListDisplay({ list, validTargets, state, selectedIndex, selected });
  screen.render();

  if (selected.size >= minTargets) {
    screen.remove(modal);
    screen.render();
    resolve(Array.from(selected));
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

function updateListDisplay(options: ListDisplayOptions): void {
  const { list, validTargets, state, selectedIndex, selected } = options;
  const lines = validTargets.map((targetId, index) => {
    const targetName = formatTarget(targetId, state);
    const isSelected = selected.has(targetId);
    const isHighlighted = index === selectedIndex;

    if (isHighlighted && isSelected) {
      return `{green-fg}{bold}→ [X] ${index + 1}. ${targetName}{/bold}{/green-fg}`;
    }
    if (isHighlighted) {
      return `{green-fg}{bold}→ [ ] ${index + 1}. ${targetName}{/bold}{/green-fg}`;
    }
    if (isSelected) {
      return `{cyan-fg}[X] ${index + 1}. ${targetName}{/cyan-fg}`;
    }
    return `  [ ] ${index + 1}. ${targetName}`;
  });

  list.setContent(lines.join('\n'));
  list.setScrollPerc(
    (selectedIndex / validTargets.length) * SCROLL_PERCENTAGE_MULTIPLIER,
  );
}

function formatTarget(targetId: TargetId, state: GameState): string {
  // Check if it's a player
  const player = state.players[targetId as keyof typeof state.players];
  if (player) {
    return player.name;
  }
  // Check if it's a card/permanent
  const card = state.cards[targetId as keyof typeof state.cards];
  if (card) {
    const definition = state.cardDefinitions[card.definitionId];
    return definition?.name ?? targetId;
  }
  return targetId;
}
