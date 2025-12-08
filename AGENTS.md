# AGENTS

## Mission

- Deliver a reusable TypeScript game engine for Magic: The Gathering that favors clarity, composability, and exhaustive test coverage over premature optimization.
- Model rule objects (cards, zones, stack, turn structure) as small, composable modules rather than giant inheritance trees.
- Encourage a culture of incremental TDD using Jest so every card interaction is documented through tests first.
- IMPORTANT: Game reference material exists in `./reference/*`. This includes a comprehensive rule guide.

## Core Principles

### Clean Code (Robert C. Martin)

1. **Expressive names** – card abilities, triggers, and game actions must read like the rule text they represent (`createToken`, `resolveStack`, `applyReplacementEffect`).
2. **Small functions** – keep logic to ~10 lines whenever possible; prefer extracting helpers per layer (domain, rules evaluation, UI adapters).
3. **Single responsibility** – each module should have one reason to change; e.g., `ManaPool` tracks mana, not priority or damage assignment.
4. **Avoid side effects** – mutate only through deliberate domain commands; never leak mutable references to game state outside their module.
5. **Readable error handling** – adopt guard clauses and exhaustive switch statements for state machines (combat steps, stack resolution).
6. **Comments for intent** – only explain non-obvious design choices (e.g., corner-case rulings); trust descriptive code for the rest.

### Composing Software (Eric Elliott)

1. **Favor pure functions** – represent rules as pure evaluators (`canCastSpell`, `calculateStateBasedActions`) so they compose predictably.
2. **Use function composition** – build card effects by composing primitives (filter, map, reduce over permanents) instead of deep class hierarchies.
3. **Data last, functions first** – treat cards as data objects and pass them through pipelines of capability functions.
4. **Immutability as default** – clone or freeze critical state when sharing; persistent data structures help with game history/replay.
5. **Higher-order utilities** – export factories that wrap core logic with logging, rule enforcement, or performance instrumentation.
6. **Declarative flows** – describe what happens (stack resolves, triggers fire) instead of micromanaging sequencing logic inside every spell.

## Workflow Expectations

1. **TDD loop** – red (write failing Jest test describing MTG behavior) → green (minimum code to pass) → refactor (improve structure with confidence).
2. **Card-driven specs** – every new mechanic starts as a Jest specification referencing the official ruling; cite Gatherer/Comprehensive Rules in test names when helpful.
3. **Mutation-safe testing** – add regression tests for every discovered bug before fixing it.
4. **Watch mode** – run `npm test -- --watch` during active development to keep feedback tight; commit only when the full suite passes.
5. **Coverage gates** – keep critical modules (rules engine, stack resolution, combat) at ≥95% statement coverage; new files should not drop overall coverage.
6. **Harness boundaries** – `src/index.ts` is only a thin adapter for player decisions; it must never mutate state directly. All state changes live in the engine layer or deeper.

## System Architecture

### Core Components

- **Reducer Pattern** (`@/core/state/reducer.ts`) – Central `reduce` function dispatches `GameAction` (discriminated union) to appropriate handler functions. All state changes flow through this single entry point.
- **Handler Functions** (`@/core/state/handlers/`) – Pure functions that receive `ReduceContext` and modify state immutably using immer's `produce`. Each handler corresponds to a specific `GameAction` type (e.g., `handleCastSpell`, `handleResolveTopOfStack`).
- **ReduceContext Pattern** – Context object passed to handlers containing:
  - `state: GameState` – Deep-cloned current game state (via `cloneDeep`)
  - `events: GameEvent[]` – Array of events emitted during the action
  - `emit(event: GameEvent): void` – Function to emit events for side effects
- **Decision Pipeline** (`@/core/actions/available-decisions.ts`) – Composable functions in `DECISION_PIPELINE` array that determine available player decisions. Each function (`addCastSpellDecisions`, `addPlayLandDecisions`, etc.) takes state, playerId, and current decisions array, returning an updated decisions array using immer internally.
- **Game Loop** (`@/core/engine/engine.ts`) – `runGame` function processes engine actions (`ADVANCE_TO_NEXT_STEP`, `RESOLVE_TOP_OF_STACK`) automatically until a player decision is needed or the game ends. Returns `RunGameResult` indicating whether a decision is needed.
- **GameController** (`@/core/engine/game-controller.ts`) – Main interface (`createGameController`) that wraps the game loop and manages player decisions. Provides methods: `getState()`, `getAvailableDecisions()`, `provideDecision()`, `onEvents()`. Converts `PlayerDecision` to `GameAction` and continues the loop.
- **Event System** – Handlers emit typed `GameEvent` objects (discriminated union) for observability. Events include `SPELL_CAST`, `SPELL_RESOLVED`, `CARD_MOVED`, `MANA_ADDED`, `PLAYER_DECISION_REQUESTED`, etc. Event callbacks can be registered via `controller.onEvents()`.
- **Card Definition System** (`@/core/card/card.ts`) – Declarative card structure using `defineCard()` factory. Cards have `abilities` array where each ability has an `effect` function that receives `ReduceContext` and `AbilityEffectArgs`. Supports spell, activated, triggered, and static abilities.
- **Turn Structure** (`@/core/turn/`) – Manages phases, steps, and turn-based actions. `phase-advancement.ts` determines when to advance; `turn-based-actions.ts` executes automatic actions (draw, untap); `turn-structure.ts` defines phase/step enums and relationships.
- **Priority System** (`@/core/priority/priortity.ts`) – Tracks which players have passed priority. `getNextPlayerWithPriority()` determines who receives priority next. Priority resets when a player takes an action (rule 117.3c).

## Architecture Patterns

### State Management with Immer

All state mutations use `produce` from immer for immutable updates:

```typescript
ctx.state = produce(ctx.state, (draft) => {
  draft.players[playerId].manaPool[color] += amount;
});
```

Handlers receive a `ReduceContext` with a deep-cloned state (`cloneDeep`), allowing safe mutation within `produce` blocks. The context pattern ensures handlers don't leak mutable references.

### Handler Pattern

Handlers are pure functions that:

1. Receive `ReduceContext` and a specific `GameAction` type
2. Validate preconditions (throw errors for invalid state)
3. Mutate state via `produce` blocks
4. Emit events via `ctx.emit()` for side effects
5. Return `void` (mutations happen on `ctx.state`)

Example:

```typescript
export function handleCastSpell(
  ctx: ReduceContext,
  action: Extract<GameAction, { type: 'CAST_SPELL' }>,
): void {
  // Validate, mutate state, emit events
}
```

### Decision Pipeline Pattern

Decision functions compose in a pipeline using `reduce`:

```typescript
const DECISION_PIPELINE: DecisionFunction[] = [
  addPlayLandDecisions,
  addCastSpellDecisions,
  addTapPermanentForManaDecisions,
  addPassPriorityDecisions,
  addEndGameDecisions,
];
```

Each function uses `produce` internally for immutable updates, making them self-contained and testable in isolation.

### Action and Event Types

Both `GameAction` and `GameEvent` use discriminated unions for type-safe dispatching:

```typescript
type GameAction =
  | {
      type: 'CAST_SPELL';
      playerId: PlayerId;
      cardId: CardId;
      targets?: TargetId[];
    }
  | { type: 'RESOLVE_TOP_OF_STACK' }
  | { type: 'ADVANCE_TO_NEXT_STEP' };
// ...
```

The `type` field enables exhaustive pattern matching in switch statements and type narrowing.

### Game Loop Flow

1. `runGame()` calls `nextEngineAction()` to determine if an automatic action is needed
2. If engine action exists (e.g., `ADVANCE_TO_NEXT_STEP`), reduce it and continue loop
3. If no engine action, determine next player with priority and request decision
4. GameController converts `PlayerDecision` to `GameAction`, reduces it, then continues loop
5. Loop continues until game ends or player decision needed

## File Structure

- `src/core/state/` – State management: `reducer.ts` (dispatch), `state.ts` (GameState type, `nextEngineAction`), `handlers/` (action handlers)
- `src/core/actions/` – Decision system: `available-decisions.ts` (pipeline), `decisions/` (individual decision functions)
- `src/core/engine/` – Game loop: `engine.ts` (`runGame`), `game-controller.ts` (GameController interface)
- `src/core/turn/` – Turn management: `turn-structure.ts` (phases/steps), `phase-advancement.ts` (advancement logic), `turn-based-actions.ts` (automatic actions), `turn-state.ts` (turn state type)
- `src/core/card/` – Card system: `card.ts` (CardDefinition, abilities), `move-card.ts` (zone transitions)
- `src/core/costs/` – Mana system: `mana-costs.ts` (cost parsing), `mana-pool.ts` (pool management), `pay-mana.ts` (cost payment)
- `src/core/priority/` – Priority tracking: `priortity.ts` (priority management functions)
- `src/core/deck/` – Deck management: `deck.ts` (deck registration, shuffling, drawing)
- `src/core/primitives/` – Core types: `id.ts` (ID generation), `ordered-stack.ts` (stack data structure)
- `src/core/random/` – Random number generation: `random.ts` (seeded RNG)
- `src/core/stack/` – Stack data structure: `stack.ts` (StackObject type)
- `src/core/game-modes/` – Game mode system: `types.ts` (GameMode interface), `commander.ts` (Commander mode)
- `src/card-definitions/` – Declarative card definitions (e.g., `lightning-bolt/card.ts`, `mountain/card.ts`)
- `src/__integration-tests__/` – Integration tests: `rules/` (rule compliance), `scenarios/` (end-to-end scenarios)
- `src/__tests__/` – Shared test utilities: `test-utils.ts`
- `src/index.ts` – Public API: `createGame()`, `GameController`, `GameSettings`
- `src/clients/shared/` – Client abstraction layer: `client-interface.ts` (Client interface), `decision-parser.ts` (input parsing), `game-state-renderer.ts` (state formatting)
- `src/clients/tui/` – Terminal UI client: `tui-client.ts` (TUIClient class), `cli.ts` (CLI entry point), `components/` (UI panels), `input/` (input handlers), `utils/` (formatting utilities)

## Client Implementations

The engine supports multiple client implementations through a common `Client` interface abstraction. This allows the same game engine to be used with different interfaces (TUI, web, simulation harness, etc.).

### Client Interface

All clients implement the `Client` interface (`@/clients/shared/client-interface.ts`):

```typescript
export interface Client {
  startGame(settings: GameSettings): void;
  handleDecision(playerId: PlayerId, decision: PlayerDecision): void;
  render(state: GameState): void;
  onEvent(event: GameEvent): void;
  getController(): GameController | null;
  shutdown(): void;
}
```

This abstraction ensures clients can:

- Start games with consistent settings
- Handle player decisions uniformly
- Render game state appropriately for their medium
- React to game events
- Access the underlying game controller
- Clean up resources on shutdown

### Terminal UI (TUI) Client

The TUI client (`@/clients/tui/tui-client.ts`) provides a full-featured terminal-based interface using the `blessed` library. It demonstrates how to build a complete client implementation.

#### Architecture

The TUI client follows a component-based architecture:

1. **TUIClient** – Main client class that:
   - Manages the game loop and coordinates UI updates
   - Handles user input and converts it to `PlayerDecision` objects
   - Renders game state across multiple panels
   - Manages event subscriptions and display

2. **Layout Manager** (`utils/layout-manager.ts`) – Creates and manages blessed screen regions:
   - Top bar (game state, life totals, mana pools)
   - Left panel (hand)
   - Center panel (battlefield/stack)
   - Right panel (available decisions)
   - Bottom panel (event log)

3. **Display Components** (`components/`) – Pure functions that update individual UI panels:
   - `hand-panel.ts` – Displays cards in hand with playability highlighting
   - `battlefield-panel.ts` – Shows permanents grouped by controller
   - `stack-panel.ts` – Displays spells/abilities on the stack
   - `decisions-menu.ts` – Lists available decisions with keyboard shortcuts
   - `event-log.ts` – Color-coded event history with scrolling

4. **Input Handlers** (`input/`) – Handle complex user interactions:
   - `card-selector.ts` – Interactive modal for selecting cards
   - `target-selector.ts` – Modal for selecting spell/ability targets

5. **Shared Utilities** (`@/clients/shared/`) – Reusable formatting and parsing:
   - `game-state-renderer.ts` – Formats game state for display
   - `decision-parser.ts` – Parses user input into `PlayerDecision` objects

#### Game Loop Pattern

The TUI client implements an asynchronous game loop:

1. **Automatic Advancement** – Engine actions (phase advancement, stack resolution) happen automatically
2. **Decision Detection** – When a decision is needed, `isWaitingForDecision()` returns true
3. **Human vs Automated** – Human players wait for input; automated players auto-pass
4. **Input Handling** – User input (number keys, shortcuts) is converted to decisions via `parseDecisionInput()`
5. **Target Selection** – Decisions requiring targets trigger interactive modals
6. **Error Handling** – Invalid decisions display error messages and allow retry

#### Key Patterns

- **Event-Driven Rendering** – Subscribes to game events via `controller.onEvents()` and re-renders on state changes
- **Status Messages** – Manages temporary status messages (errors, prompts) that persist until cleared
- **Modal Interactions** – Uses blessed modals for card/target selection, temporarily suspending main input handling
- **Player-Specific Views** – Renders game state from the perspective of the player needing a decision
- **Graceful Shutdown** – Handles SIGINT/SIGTERM to clean up blessed screen resources

#### Usage

The TUI client can be run via CLI:

```bash
npm run tui                    # Multi-player mode
npm run tui -- --single-player # Single-player (auto-pass opponents)
npm run tui -- --seed <seed>  # Reproducible games
```

The CLI entry point (`cli.ts`) parses arguments, creates default game settings, and initializes the TUIClient with appropriate options.

#### Extensibility

The TUI client demonstrates patterns for building other clients:

- **Web Client** – Could use React/Vue components instead of blessed panels
- **Simulation Harness** – Could auto-make decisions based on algorithms
- **Replay Viewer** – Could render historical game states without input handling

All clients share the same `GameController` interface, ensuring consistent behavior across implementations.

## Coding Standards

- Use modern TypeScript features (generics, discriminated unions) for type-safe rules.
- Strict `tsconfig`, no `any`, prefer explicit return types.
- Keep files under 300 lines; split large card libraries by set/mechanic.
- Document public APIs with TSDoc; include rationale for intentionally complex flows (e.g., layering and dependency order).
- Maintain a shared vocabulary for card components (`Permanent`, `Spell`, `Ability`, `Effect`) to avoid synonyms that confuse readers.
- **Never use barrel files** (index.ts files that only re-export) – they can cause performance issues with tree-shaking and module resolution. Import directly from source files instead.
- **Use `@` path alias for imports** – Prefer `@/core/random/random` over relative paths like `../../core/random/random` for cleaner, more maintainable imports. The `@` alias maps to the `src` directory root.

### Handler Conventions

- Handlers must be pure functions receiving `ReduceContext` and a specific `GameAction` type
- Use `produce` from immer for all state mutations – never mutate `ctx.state` directly
- Emit events via `ctx.emit()` for side effects (logging, UI updates, triggers)
- Validate preconditions at the start and throw descriptive errors for invalid state
- Use `Extract<GameAction, { type: 'ACTION_TYPE' }>` for type-safe action extraction

### Decision Function Conventions

- Decision functions should use `produce` internally for immutable updates
- Each function takes `(state, playerId, decisions)` and returns updated decisions array
- Functions should be composable and testable in isolation
- Use descriptive names: `addCastSpellDecisions`, `addPlayLandDecisions`, etc.

### State Mutation Guidelines

- Always use `produce` from immer – this ensures immutability and enables time-travel debugging
- Deep clone state in `makeContext()` using `cloneDeep` to prevent accidental mutations
- Never mutate `ctx.state` outside of `produce` blocks
- Return new state from helper functions (e.g., `payManaCost` returns new state)

## Testing Playbook

1. **Game flow tests** – cover casting, stack resolution, combat, and end step cleanup through scenario-based suites.
2. **Mechanic-specific suites** – e.g., `__tests__/mechanics/scry.test.ts` to keep specialized assertions focused.
3. **Property tests** – where applicable, use generated card data to assert invariants (life total never drops below -infinite, tokens respect state-based actions).
4. **Snapshot states** – capture serialized game states to detect accidental API surface changes.
5. **Test doubles** – mock only at module boundaries (e.g., adapters); keep rule evaluators real to ensure fidelity.

### Testing Anti-Patterns to Avoid

1. **Conditionals in tests** – Never use `if` statements to check preconditions. Use assertions instead. Conditionals hide bugs by silently skipping test steps when expectations aren't met.
   - ❌ Bad: `if (controller.isWaitingForDecision()) { controller.provideDecision(...); }`
   - ✅ Good: `expect(controller.isWaitingForDecision()).toBe(true); controller.provideDecision(...);`
   - ❌ Bad: `if (decision) { controller.provideDecision(decision); }`
   - ✅ Good: `expect(decision).toBeDefined(); controller.provideDecision(decision);`

2. **Loops without bounds** – Avoid unbounded `while` loops in tests. They can hang indefinitely if game state doesn't progress correctly. Use explicit assertions about expected state transitions instead.
   - ❌ Bad: `while (controller.isWaitingForDecision()) { controller.provideDecision({ type: 'PASS' }); }`
   - ✅ Good: Assert expected number of decisions or use a bounded loop with a maximum iteration count and failure assertion.

3. **Silent failures** – Every test step should assert its preconditions. If a decision isn't available when expected, the test should fail immediately, not skip silently.
   - ❌ Bad: Checking if something exists before using it without asserting
   - ✅ Good: Asserting that required state/decisions exist before proceeding

4. **Missing state assertions** – After each game action, verify the expected state changes occurred. Don't assume actions succeeded just because no exception was thrown.
   - ❌ Bad: `controller.provideDecision(...); // assume it worked`
   - ✅ Good: `controller.provideDecision(...); expect(controller.getState().players[...].hand).toHaveLength(expectedCount);`

## Extensibility Guidelines

- Introduce new mechanics via feature flags or capability descriptors rather than branching logic inside the engine core.
- Keep card definitions declarative (JSON/TS objects) so they can be composed or overridden for custom formats.
- When in doubt, bias toward data-driven approaches; let configuration describe what to compose.
