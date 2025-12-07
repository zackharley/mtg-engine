import {
  getNextPhase,
  getNextStep,
  Phase,
  PHASE_ORDER,
  PHASE_STEPS,
  Step,
  stepGrantsPriority,
  STEPS_WITHOUT_PRIORITY,
} from './turn-structure';

describe('turn-structure', () => {
  describe('Phase enum', () => {
    it('defines all five phases', () => {
      expect(Phase.BEGINNING).toBe('BEGINNING');
      expect(Phase.PRECOMBAT_MAIN).toBe('PRECOMBAT_MAIN');
      expect(Phase.COMBAT).toBe('COMBAT');
      expect(Phase.POSTCOMBAT_MAIN).toBe('POSTCOMBAT_MAIN');
      expect(Phase.ENDING).toBe('ENDING');
    });
  });

  describe('Step enum', () => {
    it('defines all turn steps', () => {
      expect(Step.UNTAP).toBe('UNTAP');
      expect(Step.UPKEEP).toBe('UPKEEP');
      expect(Step.DRAW).toBe('DRAW');
      expect(Step.BEGINNING_OF_COMBAT).toBe('BEGINNING_OF_COMBAT');
      expect(Step.DECLARE_ATTACKERS).toBe('DECLARE_ATTACKERS');
      expect(Step.DECLARE_BLOCKERS).toBe('DECLARE_BLOCKERS');
      expect(Step.COMBAT_DAMAGE).toBe('COMBAT_DAMAGE');
      expect(Step.END_OF_COMBAT).toBe('END_OF_COMBAT');
      expect(Step.END).toBe('END');
      expect(Step.CLEANUP).toBe('CLEANUP');
    });
  });

  describe('PHASE_STEPS', () => {
    it('maps each phase to its constituent steps', () => {
      expect(PHASE_STEPS[Phase.BEGINNING]).toEqual([
        Step.UNTAP,
        Step.UPKEEP,
        Step.DRAW,
      ]);
      expect(PHASE_STEPS[Phase.PRECOMBAT_MAIN]).toEqual([]);
      expect(PHASE_STEPS[Phase.COMBAT]).toEqual([
        Step.BEGINNING_OF_COMBAT,
        Step.DECLARE_ATTACKERS,
        Step.DECLARE_BLOCKERS,
        Step.COMBAT_DAMAGE,
        Step.END_OF_COMBAT,
      ]);
      expect(PHASE_STEPS[Phase.POSTCOMBAT_MAIN]).toEqual([]);
      expect(PHASE_STEPS[Phase.ENDING]).toEqual([Step.END, Step.CLEANUP]);
    });
  });

  describe('PHASE_ORDER', () => {
    it('defines phases in turn order', () => {
      expect(PHASE_ORDER).toEqual([
        Phase.BEGINNING,
        Phase.PRECOMBAT_MAIN,
        Phase.COMBAT,
        Phase.POSTCOMBAT_MAIN,
        Phase.ENDING,
      ]);
    });
  });

  describe('STEPS_WITHOUT_PRIORITY', () => {
    it('contains steps that do not grant priority', () => {
      expect(STEPS_WITHOUT_PRIORITY.has(Step.UNTAP)).toBe(true);
      expect(STEPS_WITHOUT_PRIORITY.has(Step.CLEANUP)).toBe(true);
      expect(STEPS_WITHOUT_PRIORITY.has(Step.DRAW)).toBe(false);
      expect(STEPS_WITHOUT_PRIORITY.has(Step.UPKEEP)).toBe(false);
    });
  });

  describe('stepGrantsPriority', () => {
    it('returns false for steps without priority', () => {
      expect(stepGrantsPriority(Step.UNTAP)).toBe(false);
      expect(stepGrantsPriority(Step.CLEANUP)).toBe(false);
    });

    it('returns true for steps that grant priority', () => {
      expect(stepGrantsPriority(Step.UPKEEP)).toBe(true);
      expect(stepGrantsPriority(Step.DRAW)).toBe(true);
      expect(stepGrantsPriority(Step.BEGINNING_OF_COMBAT)).toBe(true);
      expect(stepGrantsPriority(Step.DECLARE_ATTACKERS)).toBe(true);
      expect(stepGrantsPriority(Step.DECLARE_BLOCKERS)).toBe(true);
      expect(stepGrantsPriority(Step.COMBAT_DAMAGE)).toBe(true);
      expect(stepGrantsPriority(Step.END_OF_COMBAT)).toBe(true);
      expect(stepGrantsPriority(Step.END)).toBe(true);
    });
  });

  describe('getNextStep', () => {
    it('returns first step when current step is null', () => {
      expect(getNextStep(Phase.BEGINNING, null)).toBe(Step.UNTAP);
      expect(getNextStep(Phase.COMBAT, null)).toBe(Step.BEGINNING_OF_COMBAT);
      expect(getNextStep(Phase.ENDING, null)).toBe(Step.END);
    });

    it('returns next step in phase', () => {
      expect(getNextStep(Phase.BEGINNING, Step.UNTAP)).toBe(Step.UPKEEP);
      expect(getNextStep(Phase.BEGINNING, Step.UPKEEP)).toBe(Step.DRAW);
      expect(getNextStep(Phase.COMBAT, Step.BEGINNING_OF_COMBAT)).toBe(
        Step.DECLARE_ATTACKERS,
      );
      expect(getNextStep(Phase.COMBAT, Step.DECLARE_ATTACKERS)).toBe(
        Step.DECLARE_BLOCKERS,
      );
    });

    it('returns null when at last step of phase', () => {
      expect(getNextStep(Phase.BEGINNING, Step.DRAW)).toBe(null);
      expect(getNextStep(Phase.COMBAT, Step.END_OF_COMBAT)).toBe(null);
      expect(getNextStep(Phase.ENDING, Step.CLEANUP)).toBe(null);
    });

    it('returns null for phases with no steps', () => {
      expect(getNextStep(Phase.PRECOMBAT_MAIN, null)).toBe(null);
      expect(getNextStep(Phase.POSTCOMBAT_MAIN, null)).toBe(null);
    });

    it('defaults to first step for invalid current step', () => {
      expect(getNextStep(Phase.BEGINNING, Step.DECLARE_ATTACKERS)).toBe(
        Step.UNTAP,
      );
    });
  });

  describe('getNextPhase', () => {
    it('returns next phase in order', () => {
      expect(getNextPhase(Phase.BEGINNING)).toBe(Phase.PRECOMBAT_MAIN);
      expect(getNextPhase(Phase.PRECOMBAT_MAIN)).toBe(Phase.COMBAT);
      expect(getNextPhase(Phase.COMBAT)).toBe(Phase.POSTCOMBAT_MAIN);
      expect(getNextPhase(Phase.POSTCOMBAT_MAIN)).toBe(Phase.ENDING);
    });

    it('wraps to beginning phase after ending phase', () => {
      expect(getNextPhase(Phase.ENDING)).toBe(Phase.BEGINNING);
    });

    it('defaults to beginning phase for invalid phase', () => {
      expect(getNextPhase('INVALID' as Phase)).toBe(Phase.BEGINNING);
    });
  });
});
