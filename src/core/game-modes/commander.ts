import { GameSettings, PlayerSettings } from '../../index';
import { GameMode } from './types';

const COMMANDER_STARTING_LIFE = 40;

/**
 * Commander game mode configuration.
 * Based on Magic: The Gathering Comprehensive Rules 903.
 *
 * Key features:
 * - Starting life total: 40 (rule 903.7)
 * - Commanders start in command zone (rule 903.6)
 * - Each player must designate a commander (rule 903.3)
 */
export const commanderGameMode: GameMode = {
  apply(settings: GameSettings): GameSettings {
    return {
      ...settings,
      // Override starting life to 40 for Commander
      startingLife: COMMANDER_STARTING_LIFE,
      // Ensure all players have commanders
      players: settings.players.map((player) => {
        if (!player.commander) {
          throw new Error(
            `Commander game mode requires each player to have a commander. Player "${player.name ?? 'Unknown'}" is missing a commander.`,
          );
        }
        return player;
      }),
    };
  },
};

/**
 * Creates a Commander game mode configuration.
 * This is a convenience function that applies the commander game mode to settings.
 */
export function createCommanderGame(
  settings: Omit<GameSettings, 'startingLife'> & {
    players: Array<PlayerSettings & { commander: PlayerSettings['commander'] }>;
  },
): GameSettings {
  return commanderGameMode.apply(settings as GameSettings);
}
