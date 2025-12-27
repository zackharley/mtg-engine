import type blessed from 'blessed';

import type { GameEvent } from '@/core/state/reducer';
import type { GameState } from '@/core/state/state';

const MAX_EVENTS = 100;
const SCROLL_TO_BOTTOM_PERCENTAGE = 100;

/**
 * Manages the event log display.
 */
export class EventLog {
  private events: string[] = [];
  private readonly panel: blessed.Widgets.BoxElement;

  constructor(panel: blessed.Widgets.BoxElement) {
    this.panel = panel;
  }

  /**
   * Adds a new event to the log.
   */
  addEvent(event: GameEvent, state: GameState): void {
    const formatted = formatEvent(event, state);
    this.events.push(formatted);

    // Keep only the last MAX_EVENTS events
    if (this.events.length > MAX_EVENTS) {
      this.events.shift();
    }

    this.updateDisplay();
  }

  /**
   * Updates the display with current events.
   */
  private updateDisplay(): void {
    const content = this.events.join('\n');
    this.panel.setContent(content);
    this.panel.setScrollPerc(SCROLL_TO_BOTTOM_PERCENTAGE); // Auto-scroll to bottom
    this.panel.screen?.render();
  }

  /**
   * Adds an error message directly to the log.
   */
  addError(message: string): void {
    this.events.push(`{red-fg}ERROR: ${message}{/red-fg}`);
    this.updateDisplay();
  }

  /**
   * Clears all events.
   */
  clear(): void {
    this.events = [];
    this.updateDisplay();
  }
}

/**
 * Formats a game event for display.
 */
function formatEvent(event: GameEvent, state: GameState): string {
  switch (event.type) {
    case 'SPELL_CAST':
      return formatSpellCast(event, state);
    case 'SPELL_RESOLVED':
      return formatSpellResolved(event, state);
    case 'CARD_MOVED':
      return formatCardMoved(event, state);
    case 'MANA_ADDED':
      return formatManaAdded(event, state);
    case 'DIRECT_DAMAGE_APPLIED':
      return formatDirectDamage(event, state);
    case 'LIFE_GAINED':
      return formatLifeGained(event, state);
    case 'PLAYER_DECISION_REQUESTED':
      return formatPlayerDecisionRequested(event, state);
    case 'KILL_SWITCH_TRIGGERED':
      return formatKillSwitch(event);
    default: {
      return `Unknown event: ${JSON.stringify(event)}`;
    }
  }
}

function formatSpellCast(
  event: Extract<GameEvent, { type: 'SPELL_CAST' }>,
  state: GameState,
): string {
  const card = state.cards[event.cardId];
  const definition = card ? state.cardDefinitions[card.definitionId] : null;
  const cardName = definition?.name ?? event.cardId;
  const player = state.players[event.playerId];
  const playerName = player?.name ?? event.playerId;
  const targetsStr =
    event.targets.length > 0 ? ` targeting ${event.targets.join(', ')}` : '';
  return `{yellow-fg}${playerName} cast ${cardName}${targetsStr}{/yellow-fg}`;
}

function formatSpellResolved(
  event: Extract<GameEvent, { type: 'SPELL_RESOLVED' }>,
  state: GameState,
): string {
  const card = state.cards[event.cardId];
  const definition = card ? state.cardDefinitions[card.definitionId] : null;
  const cardName = definition?.name ?? event.cardId;
  const player = state.players[event.playerId];
  const playerName = player?.name ?? event.playerId;
  return `{green-fg}${cardName} resolved (${playerName}){/green-fg}`;
}

function formatCardMoved(
  event: Extract<GameEvent, { type: 'CARD_MOVED' }>,
  state: GameState,
): string {
  const card = state.cards[event.cardId];
  const definition = card ? state.cardDefinitions[card.definitionId] : null;
  const cardName = definition?.name ?? event.cardId;
  return `{cyan-fg}${cardName} moved: ${event.from} → ${event.to}{/cyan-fg}`;
}

function formatManaAdded(
  event: Extract<GameEvent, { type: 'MANA_ADDED' }>,
  state: GameState,
): string {
  const player = state.players[event.playerId];
  const playerName = player?.name ?? event.playerId;
  return `{blue-fg}${playerName} added ${event.amount} ${event.color} mana{/blue-fg}`;
}

function formatDirectDamage(
  event: Extract<GameEvent, { type: 'DIRECT_DAMAGE_APPLIED' }>,
  state: GameState,
): string {
  const targetPlayer =
    state.players[event.targetId as keyof typeof state.players];
  const target = targetPlayer?.name ?? event.targetId;
  return `{red-fg}${event.amount} damage dealt to ${target}{/red-fg}`;
}

function formatLifeGained(
  event: Extract<GameEvent, { type: 'LIFE_GAINED' }>,
  state: GameState,
): string {
  const player = state.players[event.playerId];
  const playerName = player?.name ?? event.playerId;
  return `{green-fg}${playerName} gained ${event.amount} life{/green-fg}`;
}

function formatPlayerDecisionRequested(
  event: Extract<GameEvent, { type: 'PLAYER_DECISION_REQUESTED' }>,
  state: GameState,
): string {
  const player = state.players[event.playerId];
  const playerName = player?.name ?? event.playerId;
  return `{magenta-fg}${playerName} needs to make a decision{/magenta-fg}`;
}

function formatKillSwitch(
  event: Extract<GameEvent, { type: 'KILL_SWITCH_TRIGGERED' }>,
): string {
  return `{red-fg}Kill switch triggered: ${event.reason}{/red-fg}`;
}
