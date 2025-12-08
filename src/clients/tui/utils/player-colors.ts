import type { PlayerId } from '@/core/primitives/id';

/**
 * Terminal-friendly colors for player identification.
 * These colors are distinct and work well in most terminal emulators.
 */
const PLAYER_COLORS = [
  'blue',
  'yellow',
  'magenta',
  'cyan',
  'red',
  'green',
] as const;

type PlayerColor = (typeof PLAYER_COLORS)[number];

/**
 * Map of player IDs to their assigned colors.
 * Colors are assigned on first access and persist for the lifetime of the game.
 */
const playerColorMap = new Map<PlayerId, PlayerColor>();

/**
 * Gets the color assigned to a player.
 * If the player doesn't have a color yet, assigns one from the palette.
 * Colors are assigned in order and cycle if there are more players than colors.
 *
 * @param playerId - The player ID to get the color for
 * @returns The blessed color name for the player
 */
export function getPlayerColor(playerId: PlayerId): PlayerColor {
  if (!playerColorMap.has(playerId)) {
    const colorIndex = playerColorMap.size % PLAYER_COLORS.length;
    playerColorMap.set(playerId, PLAYER_COLORS[colorIndex]);
  }
  return playerColorMap.get(playerId)!;
}

/**
 * Resets the color assignments.
 * Useful for testing or when starting a new game.
 */
export function resetPlayerColors(): void {
  playerColorMap.clear();
}
