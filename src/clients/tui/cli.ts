#!/usr/bin/env node

import forest from '@/card-definitions/cards/forest/card';
import island from '@/card-definitions/cards/island/card';
import lightningBolt from '@/card-definitions/cards/lightning-bolt/card';
import mountain from '@/card-definitions/cards/mountain/card';
import plains from '@/card-definitions/cards/plains/card';
import swamp from '@/card-definitions/cards/swamp/card';
import type { PlayerId } from '@/core/primitives/id';
import type { GameSettings } from '@/index';

import { TUIClient } from './tui-client';

/**
 * CLI entry point for the TUI client.
 * Parses command-line arguments and starts a game.
 */
function main(): void {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // Create default game settings if none provided
  const settings: GameSettings = options.settings ?? createDefaultSettings();

  // Create TUI client
  const humanPlayerIds = options.singlePlayer
    ? ([settings.players[0]?.id].filter(Boolean) as PlayerId[])
    : undefined;

  const client = new TUIClient({
    humanPlayerIds,
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    client.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    client.shutdown();
    process.exit(0);
  });

  // Start the game
  client.startGame(settings);
}

interface CliOptions {
  settings?: GameSettings;
  singlePlayer?: boolean;
  seed?: string;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--single-player' || arg === '-s') {
      options.singlePlayer = true;
    } else if (arg === '--seed' && i + 1 < args.length) {
      options.seed = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function createDefaultSettings(): GameSettings {
  return {
    players: [
      {
        name: 'Player 1',
        deck: [
          { definition: lightningBolt, count: 4 },
          { definition: plains, count: 4 },
          { definition: island, count: 4 },
          { definition: swamp, count: 4 },
          { definition: mountain, count: 4 },
          { definition: forest, count: 4 },
        ],
      },
      {
        name: 'Player 2',
        deck: [
          { definition: lightningBolt, count: 4 },
          { definition: plains, count: 4 },
          { definition: island, count: 4 },
          { definition: swamp, count: 4 },
          { definition: mountain, count: 4 },
          { definition: forest, count: 4 },
        ],
      },
    ],
    startingLife: 20,
  };
}

function printHelp(): void {
  console.warn(`
Magic: The Gathering TUI Client

Usage:
  npm run tui [options]

Options:
  --single-player, -s    Play in single-player mode (other players auto-pass)
  --seed <seed>         Set random seed for reproducible games
  --help, -h             Show this help message

Examples:
  npm run tui
  npm run tui -- --single-player
  npm run tui -- --seed my-seed-123
`);
}

// Run if executed directly
if (require.main === module) {
  main();
}
