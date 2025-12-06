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

- **Game State Core** – Contains immutable structures for zones, stack, mana, players. Use factories + object freezes to model snapshots; use command handlers to produce next state.
- **Rule Modules** – Encapsulate Comprehensive Rule sections (casting, priority, combat, replacement/prevention effects). Expose pure evaluators returning intents.
- **Effect Pipelines** – Compose card abilities from effect primitives (targeting, filtering, resolving) chained by higher-order helpers.
- **Event Bus** – Publish structured events (`SpellCast`, `TriggerCreated`, `StateBasedAction`) to support logging and UI; keep event types strongly typed.
- **Adapters** – Keep CLI/UI/network adapters thin; they translate I/O into domain commands without mixing presentation logic into rules.
- **Unified Player Interface** – Expose a single Player Action API that both human clients and AI agents implement so the engine remains agnostic to who controls each seat.

## Coding Standards

- Use modern TypeScript features (generics, discriminated unions) for type-safe rules.
- Strict `tsconfig`, no `any`, prefer explicit return types.
- Keep files under 300 lines; split large card libraries by set/mechanic.
- Document public APIs with TSDoc; include rationale for intentionally complex flows (e.g., layering and dependency order).
- Maintain a shared vocabulary for card components (`Permanent`, `Spell`, `Ability`, `Effect`) to avoid synonyms that confuse readers.

## Testing Playbook

1. **Game flow tests** – cover casting, stack resolution, combat, and end step cleanup through scenario-based suites.
2. **Mechanic-specific suites** – e.g., `__tests__/mechanics/scry.test.ts` to keep specialized assertions focused.
3. **Property tests** – where applicable, use generated card data to assert invariants (life total never drops below -infinite, tokens respect state-based actions).
4. **Snapshot states** – capture serialized game states to detect accidental API surface changes.
5. **Test doubles** – mock only at module boundaries (e.g., adapters); keep rule evaluators real to ensure fidelity.

## Extensibility Guidelines

- Introduce new mechanics via feature flags or capability descriptors rather than branching logic inside the engine core.
- Keep card definitions declarative (JSON/TS objects) so they can be composed or overridden for custom formats.
- When in doubt, bias toward data-driven approaches; let configuration describe what to compose.
