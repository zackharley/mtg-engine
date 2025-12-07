/**
 * Turn structure definitions based on Magic: The Gathering Comprehensive Rules.
 * See rules 500-514 for phase and step definitions.
 */

export enum Phase {
  BEGINNING = 'BEGINNING',
  PRECOMBAT_MAIN = 'PRECOMBAT_MAIN',
  COMBAT = 'COMBAT',
  POSTCOMBAT_MAIN = 'POSTCOMBAT_MAIN',
  ENDING = 'ENDING',
}

export enum Step {
  // Beginning Phase steps
  UNTAP = 'UNTAP',
  UPKEEP = 'UPKEEP',
  DRAW = 'DRAW',
  // Combat Phase steps
  BEGINNING_OF_COMBAT = 'BEGINNING_OF_COMBAT',
  DECLARE_ATTACKERS = 'DECLARE_ATTACKERS',
  DECLARE_BLOCKERS = 'DECLARE_BLOCKERS',
  COMBAT_DAMAGE = 'COMBAT_DAMAGE',
  END_OF_COMBAT = 'END_OF_COMBAT',
  // Ending Phase steps
  END = 'END',
  CLEANUP = 'CLEANUP',
}

/**
 * Maps each phase to its constituent steps in order.
 * Based on rule 500.1: beginning, precombat main, combat, postcombat main, ending.
 */
export const PHASE_STEPS: Record<Phase, Step[]> = {
  [Phase.BEGINNING]: [Step.UNTAP, Step.UPKEEP, Step.DRAW],
  [Phase.PRECOMBAT_MAIN]: [],
  [Phase.COMBAT]: [
    Step.BEGINNING_OF_COMBAT,
    Step.DECLARE_ATTACKERS,
    Step.DECLARE_BLOCKERS,
    Step.COMBAT_DAMAGE,
    Step.END_OF_COMBAT,
  ],
  [Phase.POSTCOMBAT_MAIN]: [],
  [Phase.ENDING]: [Step.END, Step.CLEANUP],
};

/**
 * Phases in turn order.
 */
export const PHASE_ORDER: Phase[] = [
  Phase.BEGINNING,
  Phase.PRECOMBAT_MAIN,
  Phase.COMBAT,
  Phase.POSTCOMBAT_MAIN,
  Phase.ENDING,
];

/**
 * Steps that do not grant priority to players.
 * Based on rule 500.3: untap step and certain cleanup steps.
 */
export const STEPS_WITHOUT_PRIORITY = new Set<Step>([
  Step.UNTAP,
  Step.CLEANUP,
]);

/**
 * Determines if a step grants priority to players.
 * Based on rule 500.2 and 500.3.
 */
export function stepGrantsPriority(step: Step): boolean {
  return !STEPS_WITHOUT_PRIORITY.has(step);
}

/**
 * Gets the next step in the current phase, or null if the phase has no more steps.
 */
export function getNextStep(
  currentPhase: Phase,
  currentStep: Step | null,
): Step | null {
  const steps = PHASE_STEPS[currentPhase];
  if (steps.length === 0) {
    return null; // Phase has no steps
  }

  if (currentStep === null) {
    return steps[0]; // First step of phase
  }

  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex === -1) {
    return steps[0]; // Invalid step, default to first
  }

  if (currentIndex < steps.length - 1) {
    return steps[currentIndex + 1];
  }

  return null; // Last step of phase
}

/**
 * Gets the next phase in turn order.
 */
export function getNextPhase(currentPhase: Phase): Phase {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === PHASE_ORDER.length - 1) {
    return PHASE_ORDER[0]; // Wrap to beginning of next turn
  }
  return PHASE_ORDER[currentIndex + 1];
}

