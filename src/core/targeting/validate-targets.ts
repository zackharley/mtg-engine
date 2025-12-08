import type { SpellAbility } from '../card/card';
import type { PlayerId, TargetId } from '../primitives/id';
import { makeContext } from '../state/reducer';
import type { GameState } from '../state/state';
import { getValidTargets } from './get-valid-targets';

/**
 * Validates that the provided targets meet the spell's targeting requirements.
 * Throws descriptive errors if targets are invalid.
 *
 * Rules enforced:
 * - Correct number of targets (minTargets ≤ targets.length ≤ maxTargets)
 * - Each target passes the validate function
 * - No duplicate targets (rule 115.3)
 *
 * @param state - Current game state
 * @param spellAbility - The spell ability with targeting requirements
 * @param targets - The targets to validate
 * @param playerId - The player casting the spell
 * @throws Error if targets are invalid
 */
export function validateTargets(
  state: GameState,
  spellAbility: SpellAbility,
  targets: TargetId[],
  playerId: PlayerId,
): void {
  // If spell has no targeting requirements, any targets (including empty) are valid
  if (!spellAbility.targets) {
    return;
  }

  // Get targeting requirements
  const ctx = makeContext(state);
  const targetRequirements = spellAbility.targets(ctx);

  // If no target requirements, any targets are valid
  if (targetRequirements.length === 0) {
    return;
  }

  // For now, we assume spells have a single targeting requirement
  // Multi-target spells would need more complex logic
  const targetRequirement = targetRequirements[0];

  // Check for duplicate targets first (rule 115.3)
  const uniqueTargets = new Set(targets);
  if (uniqueTargets.size !== targets.length) {
    throw new Error(
      'Duplicate targets are not allowed. Each target can only be chosen once.',
    );
  }

  // Check target count
  if (targets.length < targetRequirement.minTargets) {
    throw new Error(
      `${spellAbility.text} requires at least ${targetRequirement.minTargets} target(s), but ${targets.length} were provided.`,
    );
  }

  if (targets.length > targetRequirement.maxTargets) {
    throw new Error(
      `${spellAbility.text} requires at most ${targetRequirement.maxTargets} target(s), but ${targets.length} were provided.`,
    );
  }

  // Get valid targets to check against
  const validTargets = getValidTargets(state, spellAbility, playerId);

  // Validate each target
  targets.forEach((targetId) => {
    // Check if target is in the list of valid targets
    if (!validTargets.includes(targetId)) {
      throw new Error(
        `Invalid target: ${targetId}. Target does not meet the spell's targeting requirements.`,
      );
    }

    // Double-check with validate function
    const validationCtx = makeContext(state);
    if (
      !targetRequirement.validate({ ctx: validationCtx, candidateId: targetId })
    ) {
      throw new Error(
        `Invalid target: ${targetId}. Target does not pass validation.`,
      );
    }
  });
}
