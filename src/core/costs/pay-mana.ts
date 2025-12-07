import { produce } from 'immer';

import type { PlayerId } from '../primitives/id';
import type { GameState } from '../state/state';
import type { ManaColor, ManaCost } from './mana-costs';

// ManaPip is not exported, so we define a local type for the helper
type ManaPipWithKindOrType = { kind: string } | { type: string };

function getPipIdentifier(pip: ManaPipWithKindOrType): string {
  if ('kind' in pip) {
    return pip.kind;
  }
  return pip.type;
}

type ManaPool = Record<ManaColor, number>;

interface PayResult {
  manaPool: ManaPool;
}

/**
 * Deducts the given mana cost from a player's mana pool.
 * Supports colored and generic mana pips; other pip types will throw until implemented.
 */
export function payManaCost(
  state: GameState,
  playerId: PlayerId,
  cost: ManaCost,
): GameState {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(`Player ${playerId} not found in game state`);
  }

  const { manaPool: nextPool } = applyCost(player.manaPool, cost);

  return produce(state, (draft) => {
    draft.players[playerId].manaPool = nextPool;
  });
}

function applyCost(manaPool: ManaPool, cost: ManaCost): PayResult {
  let pool = { ...manaPool };
  let genericOwed = 0;

  cost.pips.forEach((pip) => {
    if (!('kind' in pip)) {
      throw new Error(`Unsupported mana pip kind "${getPipIdentifier(pip)}"`);
    }

    switch (pip.kind) {
      case 'COLORED': {
        const color = pip.color;
        const available = pool[color] ?? 0;
        if (available <= 0) {
          throw new Error(
            `Insufficient mana: need ${color}, have ${available}`,
          );
        }
        pool = { ...pool, [color]: available - pip.amount };
        break;
      }
      case 'GENERIC': {
        genericOwed += pip.amount;
        break;
      }
      case 'COLORLESS': {
        genericOwed += pip.amount;
        break;
      }
      default: {
        throw new Error(`Unsupported mana pip kind "${getPipIdentifier(pip)}"`);
      }
    }
  });

  if (genericOwed > 0) {
    pool = payGeneric(pool, genericOwed);
  }

  return { manaPool: pool };
}

const MANA_COLORS: readonly ManaColor[] = Object.freeze([
  'W',
  'U',
  'B',
  'R',
  'G',
]);
function payGeneric(pool: ManaPool, amount: number): ManaPool {
  const { nextPool, remaining } = MANA_COLORS.reduce(
    ({ nextPool, remaining }, color) => {
      if (remaining === 0) {
        return { nextPool, remaining };
      }
      const available = nextPool[color] ?? 0;
      if (available === 0) {
        return { nextPool, remaining };
      }
      const pay = Math.min(available, remaining);
      return {
        nextPool: { ...nextPool, [color]: available - pay },
        remaining: remaining - pay,
      };
    },
    { nextPool: { ...pool }, remaining: amount },
  );

  if (remaining > 0) {
    throw new Error(
      `Insufficient generic mana: need ${amount}, short by ${remaining}`,
    );
  }

  return nextPool;
}
