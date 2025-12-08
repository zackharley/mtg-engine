import type { ManaColor } from '@/core/costs/mana-costs';
import type { CardId, PlayerId } from '@/core/primitives/id';
import type { Stack } from '@/core/stack/stack';
import type { GameState } from '@/core/state/state';
import type { TurnState } from '@/core/turn/turn-state';

type PlayerState = GameState['players'][PlayerId];

/**
 * Formats player information for display.
 */
export function formatPlayerInfo(
  player: PlayerState,
  _playerId: PlayerId,
): string {
  return `${player.name} (Life: ${player.life})`;
}

/**
 * Formats mana pool for display.
 * Example: "W:1 U:0 B:0 R:2 G:1"
 */
export function formatManaPool(manaPool: Record<ManaColor, number>): string {
  const colors: ManaColor[] = ['W', 'U', 'B', 'R', 'G'];
  return (
    colors
      .map((color) => `${color}:${manaPool[color]}`)
      .filter((str) => !str.endsWith(':0'))
      .join(' ') || 'No mana'
  );
}

/**
 * Formats hand cards for display.
 * Returns array of strings, one per card.
 */
export function formatHand(cardIds: CardId[], state: GameState): string[] {
  return cardIds.map((cardId, index) => {
    const card = state.cards[cardId];
    if (!card) {
      return `${index + 1}. [Unknown Card]`;
    }
    const definition = state.cardDefinitions[card.definitionId];
    if (!definition) {
      return `${index + 1}. [Unknown Card Definition]`;
    }
    const manaCostStr = formatManaCost(definition.manaCost);
    return `${index + 1}. ${definition.name} ${manaCostStr} (${definition.type})`;
  });
}

/**
 * Formats battlefield permanents for display.
 * Returns array of strings, one per permanent.
 */
export function formatBattlefield(
  cardIds: CardId[],
  state: GameState,
): string[] {
  if (cardIds.length === 0) {
    return ['(No permanents)'];
  }

  return cardIds.map((cardId) => {
    const card = state.cards[cardId];
    if (!card) {
      return '[Unknown Card]';
    }
    const definition = state.cardDefinitions[card.definitionId];
    if (!definition) {
      return '[Unknown Card Definition]';
    }
    const tappedStr = card.tapped ? ' [TAPPED]' : '';
    return `${definition.name}${tappedStr}`;
  });
}

/**
 * Formats stack for display (top to bottom).
 * Returns array of strings, one per stack object.
 */
export function formatStack(stack: Stack, state: GameState): string[] {
  if (stack.length === 0) {
    return ['(Stack is empty)'];
  }

  return stack.map((stackObject, index) => {
    if (!stackObject.sourceCardId) {
      return `${index + 1}. [Unknown Source]`;
    }
    const card = state.cards[stackObject.sourceCardId];
    if (!card) {
      return `${index + 1}. [Unknown Card]`;
    }
    const definition = state.cardDefinitions[card.definitionId];
    if (!definition) {
      return `${index + 1}. [Unknown Card Definition]`;
    }
    const player = state.players[stackObject.controllerId];
    const playerName = player?.name || stackObject.controllerId;
    const targetsStr =
      stackObject.targets && stackObject.targets.length > 0
        ? ` -> ${stackObject.targets.join(', ')}`
        : '';
    return `${index + 1}. ${definition.name} (${playerName})${targetsStr}`;
  });
}

/**
 * Formats turn information for display.
 */
export function formatTurnInfo(turn: TurnState): string {
  const stepStr = turn.step ? ` / ${turn.step}` : '';
  return `Turn ${turn.turnNumber} - ${turn.phase}${stepStr} (Active: ${turn.activePlayerId})`;
}

/**
 * Formats mana cost for display.
 * Example: "{R}" or "{3}{R}{G}"
 */
function formatManaCost(manaCost: { pips: unknown[]; raw?: string }): string {
  if (manaCost.raw) {
    return manaCost.raw;
  }
  // Fallback: try to reconstruct from pips
  // This is a simplified version - full implementation would handle all pip types
  return '{?}';
}
