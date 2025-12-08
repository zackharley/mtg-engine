import type { CardDefinition } from '@/core/card/card';
import type { ManaCost } from '@/core/costs/mana-costs';
import type { CardId } from '@/core/primitives/id';
import type { GameState } from '@/core/state/state';

/**
 * Formats card name for display.
 */
export function formatCardName(cardId: CardId, state: GameState): string {
  const card = state.cards[cardId];
  if (!card) {
    return '[Unknown Card]';
  }
  const definition = state.cardDefinitions[card.definitionId];
  if (!definition) {
    return '[Unknown Card Definition]';
  }
  return definition.name;
}

/**
 * Formats mana cost for display.
 */
export function formatManaCost(manaCost: ManaCost): string {
  if (manaCost.raw) {
    return manaCost.raw;
  }
  // Simplified fallback - full implementation would format all pip types
  return '{?}';
}

/**
 * Formats card type for display.
 */
export function formatCardType(card: CardDefinition): string {
  return card.type;
}

/**
 * Formats card in compact format for lists.
 * Example: "Lightning Bolt {R} (instant)"
 */
export function formatCardShort(cardId: CardId, state: GameState): string {
  const card = state.cards[cardId];
  if (!card) {
    return '[Unknown Card]';
  }
  const definition = state.cardDefinitions[card.definitionId];
  if (!definition) {
    return '[Unknown Card Definition]';
  }
  const manaCostStr = formatManaCost(definition.manaCost);
  return `${definition.name} ${manaCostStr} (${definition.type})`;
}

/**
 * Formats card with full details.
 */
export function formatCardFull(cardId: CardId, state: GameState): string {
  const card = state.cards[cardId];
  if (!card) {
    return '[Unknown Card]';
  }
  const definition = state.cardDefinitions[card.definitionId];
  if (!definition) {
    return '[Unknown Card Definition]';
  }
  const manaCostStr = formatManaCost(definition.manaCost);
  const tappedStr = card.tapped ? ' [TAPPED]' : '';
  const abilitiesText = definition.abilities
    .map((ability) => ability.text)
    .join('\n');
  return `${definition.name} ${manaCostStr} (${definition.type})${tappedStr}\n${abilitiesText}`;
}
