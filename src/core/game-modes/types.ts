import type { GameSettings, PlayerSettings } from '../../index';
import type { CardDefinition } from '../card/card';

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

/**
 * Type guard to check if a game mode requires commanders.
 * Uses duck typing - checks for the presence of commander-related properties.
 */
export function requiresCommanders(
  settings: GameSettings,
): settings is GameSettings & {
  players: (PlayerSettings & { commander: CardDefinition })[];
} {
  return settings.players.some(
    (player) => 'commander' in player && player.commander !== undefined,
  );
}

/**
 * Type guard to check if a game mode uses a command zone.
 * Uses duck typing - checks if any player has a commander.
 */
export function usesCommandZone(settings: GameSettings): boolean {
  return requiresCommanders(settings);
}
