import type { PlayerDecision } from '@/core/engine/game-controller';
import type { AvailablePlayerDecision } from '@/core/state/reducer';
import type { GameState } from '@/core/state/state';

/**
 * Parses user input into a PlayerDecision.
 * Returns null if input cannot be parsed or decision is invalid.
 */
export function parseDecisionInput(
  input: string,
  availableDecisions: AvailablePlayerDecision[],
  state: GameState,
): PlayerDecision | null {
  const trimmed = input.trim().toLowerCase();

  // Handle pass priority
  const passDecision = handlePassPriority(trimmed, availableDecisions);
  if (passDecision) {
    return passDecision;
  }

  // Handle end game
  const endDecision = handleEndGame(trimmed, availableDecisions);
  if (endDecision) {
    return endDecision;
  }

  // Handle numeric input (card selection by index)
  const numericDecision = handleNumericInput(trimmed, availableDecisions);
  if (numericDecision) {
    return numericDecision;
  }

  // Handle "cast <cardname>" or "play <cardname>"
  const castDecision = handleCastInput(trimmed, availableDecisions, state);
  if (castDecision) {
    return castDecision;
  }

  // Handle "tap <cardname>"
  const tapDecision = handleTapInput(trimmed, availableDecisions, state);
  if (tapDecision) {
    return tapDecision;
  }

  return null;
}

function handlePassPriority(
  trimmed: string,
  availableDecisions: AvailablePlayerDecision[],
): PlayerDecision | null {
  if (trimmed !== 'pass' && trimmed !== 'p') {
    return null;
  }
  const passDecision = availableDecisions.find(
    (d) => d.type === 'PASS_PRIORITY',
  );
  return passDecision ? { type: 'PASS_PRIORITY' } : null;
}

function handleEndGame(
  trimmed: string,
  availableDecisions: AvailablePlayerDecision[],
): PlayerDecision | null {
  if (trimmed !== 'end' && trimmed !== 'quit' && trimmed !== 'q') {
    return null;
  }
  const endDecision = availableDecisions.find((d) => d.type === 'END_GAME');
  return endDecision ? { type: 'END_GAME' } : null;
}

function handleNumericInput(
  trimmed: string,
  availableDecisions: AvailablePlayerDecision[],
): PlayerDecision | null {
  const numericMatch = /^(\d+)$/.exec(trimmed);
  if (!numericMatch) {
    return null;
  }
  const index = parseInt(numericMatch[1], 10) - 1; // Convert to 0-based
  if (index >= 0 && index < availableDecisions.length) {
    const decision = availableDecisions[index];
    return convertAvailableDecisionToPlayerDecision(decision);
  }
  return null;
}

function handleCastInput(
  trimmed: string,
  availableDecisions: AvailablePlayerDecision[],
  state: GameState,
): PlayerDecision | null {
  const castMatch = /^(cast|play)\s+(.+)$/.exec(trimmed);
  if (!castMatch) {
    return null;
  }
  const cardName = castMatch[2].trim();
  const matchingDecision = findDecisionByCardName(
    availableDecisions,
    cardName,
    state,
  );
  return matchingDecision
    ? convertAvailableDecisionToPlayerDecision(matchingDecision)
    : null;
}

function handleTapInput(
  trimmed: string,
  availableDecisions: AvailablePlayerDecision[],
  state: GameState,
): PlayerDecision | null {
  const tapMatch = /^tap\s+(.+)$/.exec(trimmed);
  if (!tapMatch) {
    return null;
  }
  const cardName = tapMatch[1].trim();
  const matchingDecision = availableDecisions.find((d) => {
    if (d.type === 'TAP_PERMANENT_FOR_MANA') {
      return cardNameMatches(d.cardId, cardName, state);
    }
    return false;
  });
  return matchingDecision
    ? convertAvailableDecisionToPlayerDecision(matchingDecision)
    : null;
}

/**
 * Converts an AvailablePlayerDecision to a PlayerDecision.
 */
function convertAvailableDecisionToPlayerDecision(
  decision: AvailablePlayerDecision,
): PlayerDecision {
  switch (decision.type) {
    case 'CAST_SPELL':
      return {
        type: 'CAST_SPELL',
        cardId: decision.cardId,
        targets: decision.targets,
      };
    case 'PLAY_LAND':
      return {
        type: 'PLAY_LAND',
        cardId: decision.cardId,
      };
    case 'TAP_PERMANENT_FOR_MANA':
      return {
        type: 'TAP_PERMANENT_FOR_MANA',
        cardId: decision.cardId,
      };
    case 'PASS_PRIORITY':
      return { type: 'PASS_PRIORITY' };
    case 'END_GAME':
      return { type: 'END_GAME' };
  }
}

/**
 * Finds a decision by card name (case-insensitive partial match).
 */
function findDecisionByCardName(
  availableDecisions: AvailablePlayerDecision[],
  cardName: string,
  state: GameState,
): AvailablePlayerDecision | null {
  const lowerCardName = cardName.toLowerCase();

  // Try exact match first
  const exactMatch = availableDecisions.find(
    (decision) =>
      (decision.type === 'CAST_SPELL' || decision.type === 'PLAY_LAND') &&
      cardNameMatches(decision.cardId, cardName, state),
  );
  if (exactMatch) {
    return exactMatch;
  }

  // Try partial match
  const partialMatch = availableDecisions.find(
    (decision) =>
      (decision.type === 'CAST_SPELL' || decision.type === 'PLAY_LAND') &&
      cardNameMatchesPartial(decision.cardId, lowerCardName, state),
  );
  if (partialMatch) {
    return partialMatch;
  }

  return null;
}

/**
 * Checks if a card name matches exactly (case-insensitive).
 */
function cardNameMatches(
  cardId: string,
  cardName: string,
  state: GameState,
): boolean {
  const card = state.cards[cardId as keyof typeof state.cards];
  if (!card) {
    return false;
  }
  const definition = state.cardDefinitions[card.definitionId];
  if (!definition) {
    return false;
  }
  return definition.name.toLowerCase() === cardName.toLowerCase();
}

/**
 * Checks if a card name matches partially (case-insensitive).
 */
function cardNameMatchesPartial(
  cardId: string,
  partialName: string,
  state: GameState,
): boolean {
  const card = state.cards[cardId as keyof typeof state.cards];
  if (!card) {
    return false;
  }
  const definition = state.cardDefinitions[card.definitionId];
  if (!definition) {
    return false;
  }
  return definition.name.toLowerCase().includes(partialName);
}
