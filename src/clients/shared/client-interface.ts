import type { PlayerId } from '@/core/primitives/id';
import type { GameEvent } from '@/core/state/reducer';
import type { GameState } from '@/core/state/state';
import type { GameController, PlayerDecision } from '@/index';
import type { GameSettings } from '@/index';

/**
 * Base interface for all game clients (TUI, simulation harness, etc.)
 * Provides a common abstraction for interacting with the game engine.
 */
export interface Client {
  /**
   * Starts a new game with the given settings.
   */
  startGame(settings: GameSettings): void;

  /**
   * Handles a player decision.
   */
  handleDecision(playerId: PlayerId, decision: PlayerDecision): void;

  /**
   * Renders the current game state.
   */
  render(state: GameState): void;

  /**
   * Called when a game event occurs.
   */
  onEvent(event: GameEvent): void;

  /**
   * Gets the game controller instance.
   */
  getController(): GameController | null;

  /**
   * Cleanup and shutdown the client.
   */
  shutdown(): void;
}
