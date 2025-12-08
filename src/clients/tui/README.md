# Magic: The Gathering TUI Client

A Terminal User Interface (TUI) client for playing Magic: The Gathering using the MTG Engine. This client provides a full-featured terminal-based interface for playing games, managing game state, and making decisions.

## Features

- **Full Game Support**: Play complete games of Magic: The Gathering through the terminal
- **Real-time Game State**: View life totals, mana pools, hand, battlefield, and stack
- **Interactive Decision Making**: Navigate available decisions with keyboard shortcuts
- **Event Logging**: Color-coded event log showing all game events
- **Multiplayer Support**: Play with multiple human players taking turns
- **Single-player Mode**: Play against automated opponents (auto-pass)
- **Card Selection**: Interactive modals for selecting cards and targets

## Installation

The TUI client is included with the MTG Engine. Ensure all dependencies are installed:

```bash
npm install
```

## Usage

### Basic Usage

Start a game with default settings (2 players):

```bash
npm run tui
```

### Command-line Options

```bash
npm run tui -- [options]
```

**Options:**

- `--single-player`, `-s` - Play in single-player mode (other players auto-pass)
- `--seed <seed>` - Set random seed for reproducible games
- `--help`, `-h` - Show help message

**Examples:**

```bash
# Single-player mode
npm run tui -- --single-player

# Reproducible game with seed
npm run tui -- --seed my-seed-123

# Show help
npm run tui -- --help
```

## Controls

### General Controls

- `q` or `Ctrl+C` - Quit the game
- `Esc` - Cancel current action/close modal

### Decision Making

- **Number keys (1-9)** - Select a decision by number
- **`p`** - Pass priority (quick shortcut)
- **Arrow keys** - Navigate menus (in modals)
- **Enter** - Confirm selection

### Card Selection Modal

When selecting cards (e.g., for casting spells or tapping for mana):

- **Arrow keys** (`↑`/`↓`) or **`j`/`k`** - Navigate card list
- **Number keys (1-9)** - Quick select by number
- **Enter** - Select highlighted card
- **Esc** - Cancel selection

### Target Selection Modal

When selecting targets for spells:

- **Arrow keys** (`↑`/`↓`) or **`j`/`k`** - Navigate target list
- **Number keys (1-9)** - Toggle target selection
- **Enter** - Confirm target selection
- **`c`** - Confirm when minimum targets selected
- **Esc** - Cancel selection

## Interface Layout

The TUI is divided into several panels:

```
┌─────────────────────────────────────────────────────────┐
│ Top Bar: Game State (Life, Mana, Turn Info)             │
├──────────────┬──────────────┬───────────────────────────┤
│              │              │                           │
│   Hand       │  Battlefield │   Available Decisions     │
│   Panel      │  / Stack     │                           │
│              │              │                           │
├──────────────┴──────────────┴───────────────────────────┤
│ Event Log (Scrollable)                                  │
└─────────────────────────────────────────────────────────┘
```

### Panel Descriptions

1. **Top Bar**: Displays current turn information, phase/step, active player, and all players' life totals and mana pools
2. **Hand Panel**: Shows cards in the current player's hand with highlighting for playable cards
3. **Battlefield Panel**: Displays all permanents on the battlefield, grouped by controller
4. **Stack Panel**: Shows spells and abilities on the stack (top to bottom)
5. **Decisions Panel**: Lists all available decisions for the current player
6. **Event Log**: Scrollable log of all game events with color coding

## Game Flow

1. **Game Initialization**: The game starts with players drawing initial hands
2. **Turn Structure**: Players take turns following MTG turn structure (Beginning, Main, Combat, etc.)
3. **Priority**: When priority is passed, the game advances automatically
4. **Decisions**: When a decision is needed, the TUI highlights available options
5. **Stack Resolution**: Spells resolve automatically when all players pass priority

## Example Game Session

```text
1. Game starts - Player 1's turn, Beginning Phase
2. Player 1 sees available decisions:
   - Play Mountain
   - Pass Priority
3. Player 1 presses "1" to play Mountain
4. Mountain enters the battlefield
5. Player 1 can now tap Mountain for mana
6. Player 1 presses "1" to tap Mountain
7. Player 1 gains {R} mana
8. Game continues...
```

## Architecture

The TUI client is built on top of the MTG Engine's client abstraction layer:

```tree
src/clients/
├── shared/              # Shared client utilities
│   ├── client-interface.ts      # Base Client interface
│   ├── game-state-renderer.ts   # Game state formatting
│   └── decision-parser.ts       # Input parsing
└── tui/                 # TUI implementation
    ├── cli.ts           # CLI entry point
    ├── tui-client.ts   # Main TUI client
    ├── components/      # Display components
    ├── input/           # Input handlers
    └── utils/           # Utility functions
```

### Key Components

- **TUIClient**: Main client class managing game loop and UI coordination
- **Layout Manager**: Handles blessed screen layout and regions
- **Display Components**: Update individual UI panels
- **Input Handlers**: Process user input and convert to game decisions
- **Event Log**: Manages and displays game events

## Development

### Running Tests

Test the TUI client utilities:

```bash
npm test -- --testPathPattern="clients"
```

### Building

The TUI uses TypeScript and runs via `ts-node`. To build the entire project:

```bash
npm run build
```

### Extending the TUI

The TUI is designed to be extensible. Key extension points:

1. **New Display Components**: Add panels in `components/`
2. **Input Handlers**: Add new input types in `input/`
3. **Formatters**: Extend formatting utilities in `shared/` or `utils/`

## Troubleshooting

### Module Resolution Errors

If you see `Cannot find module '@/index'`:

1. Ensure `tsconfig-paths` is installed: `npm install --save-dev tsconfig-paths`
2. Verify `tsconfig.json` includes the `ts-node` configuration section

### Screen Rendering Issues

If the TUI doesn't render correctly:

1. Ensure your terminal supports 256 colors
2. Try resizing your terminal window
3. Check that blessed is properly installed: `npm list blessed`

### Game Not Progressing

If the game seems stuck:

1. Check the Event Log for error messages
2. Verify you're pressing the correct keys (number keys for decisions)
3. Try pressing `p` to pass priority

## Future Enhancements

Potential future improvements:

- [ ] Deck file loading
- [ ] Save/load game state
- [ ] Replay game history
- [ ] AI opponents
- [ ] Customizable key bindings
- [ ] Card detail view on hover
- [ ] Search/filter cards in hand
- [ ] Undo/redo functionality

## License

Part of the MTG Engine project. See main project LICENSE for details.
