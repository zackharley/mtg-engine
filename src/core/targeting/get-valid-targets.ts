import type { SpellAbility } from '../card/card';
import type { PlayerId, TargetId } from '../primitives/id';
import { makeContext } from '../state/reducer';
import type { GameState } from '../state/state';

/**
 * Gets all valid targets for a spell ability based on its targeting requirements.
 * Scans all possible targets (players and permanents) and filters them using
 * the spell's validate functions.
 *
 * @param state - Current game state
 * @param spellAbility - The spell ability with targeting requirements
 * @param playerId - The player casting the spell
 * @returns Array of valid TargetIds
 */
export function getValidTargets(
  state: GameState,
  spellAbility: SpellAbility,
  _playerId: PlayerId,
): TargetId[] {
  // If spell has no targeting requirements, return empty array
  if (!spellAbility.targets) {
    return [];
  }

  // Get targeting requirements
  const ctx = makeContext(state);
  const targetRequirements = spellAbility.targets(ctx);

  // If no target requirements, return empty array
  if (targetRequirements.length === 0) {
    return [];
  }

  // Collect all possible targets
  const allPossibleTargets: TargetId[] = [];

  // Add all players as potential targets
  const playerIds = Object.keys(state.players) as PlayerId[];
  allPossibleTargets.push(...playerIds);

  // Add all permanents on battlefield as potential targets
  Object.values(state.players).forEach((player) => {
    allPossibleTargets.push(...player.battlefield);
  });

  // Filter targets using the validate function from the first target requirement
  // (For now, we assume spells have a single targeting requirement.
  // Multi-target spells would need more complex logic.)
  const targetRequirement = targetRequirements[0];
  const validTargets = allPossibleTargets.filter((candidateId) => {
    const validationCtx = makeContext(state);
    return targetRequirement.validate({
      ctx: validationCtx,
      candidateId,
    });
  });

  return validTargets;
}
