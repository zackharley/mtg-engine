import type { PlayerId } from '../primitives/id';
import type { AvailablePlayerDecision } from '../state/reducer';
import type { GameState } from '../state/state';
import { addActivateAbilityDecisions } from './decisions/activate-ability';
import { addCastSpellDecisions } from './decisions/cast-spell';
import { addEndGameDecisions } from './decisions/end-game';
import { addPassPriorityDecisions } from './decisions/pass-priority';
import { addPlayLandDecisions } from './decisions/play-land';
import { addTapPermanentForManaDecisions } from './decisions/tap-permanent-for-mana';

type DecisionFunction = (
  state: GameState,
  playerId: PlayerId,
  decisions: AvailablePlayerDecision[],
) => AvailablePlayerDecision[];

/**
 * Pipeline of decision functions that determine what decisions are available to a player.
 * Each function in the pipeline takes the current decisions array and returns a new
 * immutable decisions array using immer produce internally.
 */
const DECISION_PIPELINE: DecisionFunction[] = [
  addPlayLandDecisions,
  addCastSpellDecisions,
  addActivateAbilityDecisions,
  addTapPermanentForManaDecisions, // Keep for backward compatibility, will remove later
  addPassPriorityDecisions,
  addEndGameDecisions,
];

/**
 * Determines what decisions are available to a player given the current game state.
 * Uses a pipeline pattern where each decision type is evaluated by a separate pure function.
 * Each function uses immer produce internally for immutable updates, making them self-contained.
 * This allows each decision validity function to be tested individually and keeps
 * the main function free of conditional logic.
 */
export function getAvailableDecisions(
  state: GameState,
  playerId: PlayerId,
): AvailablePlayerDecision[] {
  if (!state.players[playerId]) {
    return [];
  }

  return DECISION_PIPELINE.reduce(
    (decisions, decisionFunction) =>
      decisionFunction(state, playerId, decisions),
    [] as AvailablePlayerDecision[],
  );
}
