import type { PlayerId } from '../primitives/id';

export type GameLog = GameLogEntry[];

export interface GameLogEntry {
  type: string;
  playerId: PlayerId;
}
