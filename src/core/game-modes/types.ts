import type { GameSettings } from '../../index';

/**
 * A game mode is a package of game settings that configures how a game is initialized.
 * Game modes use duck typing - the engine checks for specific properties rather than
 * checking a game type string.
 */
export interface GameMode {
  /**
   * Applies this game mode's settings to the base game settings.
   * This allows game modes to override defaults and add mode-specific configuration.
   */
  apply(settings: GameSettings): GameSettings;
}
