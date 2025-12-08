import * as blessed from 'blessed';

export interface LayoutRegions {
  topBar: blessed.Widgets.BoxElement;
  leftPanel: blessed.Widgets.BoxElement;
  centerPanel: blessed.Widgets.BoxElement;
  rightPanel: blessed.Widgets.BoxElement;
  bottomPanel: blessed.Widgets.BoxElement;
}

/**
 * Creates a layout structure for the TUI.
 * Returns regions that can be used to place components.
 */
export function createLayout(screen: blessed.Widgets.Screen): LayoutRegions {
  const topBar = createTopBar();
  const leftPanel = createLeftPanel();
  const centerPanel = createCenterPanel();
  const rightPanel = createRightPanel();
  const bottomPanel = createBottomPanel();

  screen.append(topBar);
  screen.append(leftPanel);
  screen.append(centerPanel);
  screen.append(rightPanel);
  screen.append(bottomPanel);

  return {
    topBar,
    leftPanel,
    centerPanel,
    rightPanel,
    bottomPanel,
  };
}

function createTopBar(): blessed.Widgets.BoxElement {
  return blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 4,
    content: '',
    tags: true,
  });
}

function createLeftPanel(): blessed.Widgets.BoxElement {
  return blessed.box({
    top: 4,
    left: 0,
    width: '30%',
    height: '60%',
    content: '',
    tags: true,
    label: ' Hand ',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
  });
}

function createCenterPanel(): blessed.Widgets.BoxElement {
  return blessed.box({
    top: 4,
    left: '30%',
    width: '40%',
    height: '60%',
    content: '',
    tags: true,
    label: ' Battlefield / Stack ',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
  });
}

function createRightPanel(): blessed.Widgets.BoxElement {
  return blessed.box({
    top: 4,
    left: '70%',
    width: '30%',
    height: '60%',
    content: '',
    tags: true,
    label: ' Available Decisions ',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
  });
}

function createBottomPanel(): blessed.Widgets.BoxElement {
  return blessed.box({
    top: '64%',
    left: 0,
    width: '100%',
    height: '36%',
    content: '',
    tags: true,
    label: ' Event Log ',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
  });
}
