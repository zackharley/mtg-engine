import { CardDefinitionId, CardId, PlayerId } from '../primitives/id';
import { ManaColor } from '../costs/mana-costs';
import { Card, CardDefinition } from '../card/card';
import { GameAction } from './reducer';
import { allPlayersHavePassedPriority } from '../priority/priortity';
import { Stack } from '../stack/stack';
import { OrderedStack, isEmptyOrderedStack } from '../primitives/ordered-stack';

export interface GameState {
  players: Record<PlayerId, PlayerState>;
  cards: Record<CardId, Card>;
  cardDefinitions: Record<CardDefinitionId, CardDefinition>;
  stack: Stack;
  isKillSwitchTriggered: boolean;
}

interface PlayerState {
  life: number;
  manaPool: Record<ManaColor, number>;
  hand: CardId[];
  battlefield: CardId[];
  graveyard: OrderedStack<CardId>;
  library: OrderedStack<CardId>;
}

export type ZoneName =
  | 'hand'
  | 'battlefield'
  | 'graveyard'
  | 'library'
  | 'stack'
  | 'exile'
  | 'command';

export function isGameOver(state: GameState): boolean {
  if (state.isKillSwitchTriggered) {
    return true;
  }

  const players = Object.values(state.players);
  const alivePlayers = players.filter((player) => player.life > 0);
  if (alivePlayers.length === 1) {
    return true;
  }

  return false;
}

export function nextEngineAction(state: GameState): GameAction | null {
  if (
    allPlayersHavePassedPriority(state) &&
    !isEmptyOrderedStack(state.stack)
  ) {
    return { type: 'RESOLVE_TOP_OF_STACK' };
  }

  return null;
}
