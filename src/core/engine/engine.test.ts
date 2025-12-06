import { runGame } from './engine';
import { GameState } from '../state/state';
import { createKillSwitchStackObject } from '../stack/stack';
import { createOrderedStack, pushOrderedStack } from '../primitives/ordered-stack';
import { makePlayerId } from '../primitives/id';

describe('engine', () => {
  it('ends the game loop when a kill switch stack object resolves', () => {
    const playerA = makePlayerId();
    const playerB = makePlayerId();
    const killSwitch = createKillSwitchStackObject(playerA, 'test-kill-switch');

    const initialState: GameState = {
      players: {
        [playerA]: {
          life: 20,
          manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
          hand: [],
          battlefield: [],
          graveyard: createOrderedStack(),
          library: createOrderedStack(),
        },
        [playerB]: {
          life: 20,
          manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0 },
          hand: [],
          battlefield: [],
          graveyard: createOrderedStack(),
          library: createOrderedStack(),
        },
      },
      cards: {},
      cardDefinitions: {},
      stack: pushOrderedStack(createOrderedStack(), killSwitch),
      isKillSwitchTriggered: false,
    };

    const result = runGame(initialState);

    expect(result.finalState.isKillSwitchTriggered).toBe(true);
    expect(result.finalState.stack).toHaveLength(0);
    expect(result.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'KILL_SWITCH_TRIGGERED',
          reason: 'test-kill-switch',
        }),
      ]),
    );
  });
});
