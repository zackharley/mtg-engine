import { defineCard } from '../card/card';
import { parseManaCost } from '../costs/mana-costs';
import { commanderGameMode, createCommanderGame } from './commander';

describe('commander', () => {
  const testCommander = defineCard({
    scryfallId: 'test-commander',
    name: 'Test Commander',
    type: 'creature',
    manaCost: parseManaCost('{3}{R}'),
    abilities: [],
  });

  const testCard = defineCard({
    scryfallId: 'test-card',
    name: 'Test Card',
    type: 'instant',
    manaCost: parseManaCost('{1}'),
    abilities: [],
  });

  describe('commanderGameMode', () => {
    describe('apply', () => {
      it('sets starting life to 40 (rule 903.7)', () => {
        const settings = commanderGameMode.apply({
          players: [
            {
              name: 'Alice',
              commander: testCommander,
              deck: [{ definition: testCard, count: 1 }],
            },
            {
              name: 'Bob',
              commander: testCommander,
              deck: [{ definition: testCard, count: 1 }],
            },
          ],
        });

        expect(settings.startingLife).toBe(40);
      });

      it('allows per-player life override', () => {
        const settings = commanderGameMode.apply({
          players: [
            {
              name: 'Alice',
              life: 50,
              commander: testCommander,
              deck: [{ definition: testCard, count: 1 }],
            },
            {
              name: 'Bob',
              commander: testCommander,
              deck: [{ definition: testCard, count: 1 }],
            },
          ],
        });

        expect(settings.players[0].life).toBe(50);
        expect(settings.startingLife).toBe(40);
      });

      it('requires each player to have a commander', () => {
        expect(() => {
          commanderGameMode.apply({
            players: [
              {
                name: 'Alice',
                commander: testCommander,
                deck: [{ definition: testCard, count: 1 }],
              },
              {
                name: 'Bob',
                deck: [{ definition: testCard, count: 1 }],
              },
            ],
          });
        }).toThrow(
          'Commander game mode requires each player to have a commander',
        );
      });

      it('preserves other player settings', () => {
        const settings = commanderGameMode.apply({
          players: [
            {
              name: 'Alice',
              commander: testCommander,
              deck: [{ definition: testCard, count: 5 }],
            },
          ],
        });

        expect(settings.players[0].name).toBe('Alice');
        expect(settings.players[0].commander).toBe(testCommander);
        expect(settings.players[0].deck).toHaveLength(1);
        expect(settings.players[0].deck[0].count).toBe(5);
      });
    });
  });

  describe('createCommanderGame', () => {
    it('creates commander game settings', () => {
      const settings = createCommanderGame({
        players: [
          {
            name: 'Alice',
            commander: testCommander,
            deck: [{ definition: testCard, count: 1 }],
          },
        ],
      });

      expect(settings.startingLife).toBe(40);
      expect(settings.players[0].commander).toBe(testCommander);
    });

    it('requires commander for all players', () => {
      expect(() => {
        createCommanderGame({
          players: [
            {
              name: 'Alice',
              commander: testCommander,
              deck: [{ definition: testCard, count: 1 }],
            },
            // @ts-expect-error - Testing missing commander property
            {
              name: 'Bob',
              deck: [{ definition: testCard, count: 1 }],
            },
          ],
        });
      }).toThrow(
        'Commander game mode requires each player to have a commander',
      );
    });
  });
});
