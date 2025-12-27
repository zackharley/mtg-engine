import type { ActivatedAbility, CardAbility, TriggeredAbility } from './card';

/**
 * Determines if an activated ability is a mana ability according to rule 605.1a.
 * An activated ability is a mana ability if it meets all of the following criteria:
 * - It doesn't require a target
 * - It could add mana to a player's mana pool when it resolves
 * - It's not a loyalty ability
 *
 * @param ability - The activated ability to check
 * @returns True if the ability is a mana ability
 */
export function isActivatedManaAbility(ability: ActivatedAbility): boolean {
  // Check if it produces mana (explicit flag)
  if (!ability.producesMana) {
    return false;
  }

  // Rule 605.1a: Must not require a target
  // We don't currently have target requirements in ActivatedAbility, but this check
  // would go here if we add target support

  // Rule 605.1a: Must not be a loyalty ability
  // Loyalty abilities have loyalty symbols in their cost, which we don't support yet
  // This check would verify no loyalty symbols in the cost

  return true;
}

/**
 * Determines if a triggered ability is a mana ability according to rule 605.1b.
 * A triggered ability is a mana ability if it meets all of the following criteria:
 * - It doesn't require a target
 * - It triggers from the activation or resolution of an activated mana ability
 *   or from mana being added to a player's mana pool
 * - It could add mana to a player's mana pool when it resolves
 *
 * @param ability - The triggered ability to check
 * @returns True if the ability is a mana ability
 */
export function isTriggeredManaAbility(ability: TriggeredAbility): boolean {
  // Check if it produces mana (explicit flag)
  if (!ability.producesMana) {
    return false;
  }

  // Rule 605.1b: Must trigger from mana-related events
  // This would check the trigger condition to see if it's mana-related
  // For now, we rely on the explicit flag

  // Rule 605.1b: Must not require a target
  // We don't currently have target requirements in TriggeredAbility, but this check
  // would go here if we add target support

  return true;
}

/**
 * Determines if a card ability is a mana ability according to rules 605.1a/b.
 *
 * @param ability - The card ability to check
 * @returns True if the ability is a mana ability
 */
export function isManaAbility(ability: CardAbility): boolean {
  switch (ability.type) {
    case 'activated':
      return isActivatedManaAbility(ability);
    case 'triggered':
      return isTriggeredManaAbility(ability);
    case 'spell':
    case 'static':
      // Rule 605.5b: Spells are never mana abilities
      // Static abilities are not mana abilities
      return false;
  }
}
