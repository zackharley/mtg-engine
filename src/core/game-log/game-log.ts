import { Id } from '../id/id';

export type GameLog = GameLogEntry[];

export type GameLogEntry = {
  type: string;
  playerId: Id;
};
