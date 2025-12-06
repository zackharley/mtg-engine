import { GameAction, ReduceContext } from '../reducer';
import { advanceTurnState } from '../../turn/phase-advancement';
import { performTurnBasedActions } from '../../turn/turn-based-actions';
import { PlayerId } from '../../primitives/id';
import { resetPriorityPasses } from '../../priority/priortity';

export default function handleAdvanceToNextStep(
  ctx: ReduceContext,
  _action: Extract<GameAction, { type: 'ADVANCE_TO_NEXT_STEP' }>,
): void {
  const state = ctx.state;
  const playerOrder = Object.keys(state.players) as PlayerId[];

  // Advance to next step/phase
  let newState = advanceTurnState(state, playerOrder);

  // Perform turn-based actions for the new step (rule 703.3)
  if (newState.turn.step !== null) {
    newState = performTurnBasedActions(newState, newState.turn.step);
  }

  // Reset priority passes when entering a new step/phase
  // Each new step/phase starts with no players having passed
  newState = resetPriorityPasses(newState);

  ctx.state = newState;
}
