import { createGame } from '../../../src';
import forest from '../../../src/card-definitions/cards/forest/card';
import island from '../../../src/card-definitions/cards/island/card';
import mountain from '../../../src/card-definitions/cards/mountain/card';
import plains from '../../../src/card-definitions/cards/plains/card';
import swamp from '../../../src/card-definitions/cards/swamp/card';
import type { ManaColor } from '../../../src/core/costs/mana-costs';

const basicLands = [
  { name: 'Plains', definition: plains, manaColor: 'W' as ManaColor },
  { name: 'Island', definition: island, manaColor: 'U' as ManaColor },
  { name: 'Swamp', definition: swamp, manaColor: 'B' as ManaColor },
  { name: 'Mountain', definition: mountain, manaColor: 'R' as ManaColor },
  { name: 'Forest', definition: forest, manaColor: 'G' as ManaColor },
];

describe.each(basicLands)(
  'Play $name and tap for mana',
  ({ name, definition, manaColor }) => {
    it(`moves ${name} to the battlefield and adds one ${manaColor} mana`, () => {
      const { controller, playerIds } = createGame({
        players: [
          { deck: [{ definition, count: 1 }] },
          { deck: [] }, // Second player needed for game loop to work properly
        ],
      });

      const [playerOne] = playerIds;
      let state = controller.getState();

      expect(state.players[playerOne].hand).toHaveLength(1);
      expect(state.players[playerOne].battlefield).toHaveLength(0);
      expect(state.players[playerOne].manaPool[manaColor]).toBe(0);
      expect(state.players[playerOne].library).toHaveLength(0);

      expect(controller.isWaitingForDecision()).toBe(true);
      expect(controller.getPlayerNeedingDecision()).toBe(playerOne);

      const landCardId = state.players[playerOne].hand[0];
      const landCard = state.cards[landCardId];
      expect(landCard).toBeDefined();
      expect(state.cardDefinitions[landCard.definitionId].name).toBe(name);

      // Play the land
      expect(controller.isWaitingForDecision()).toBe(true);
      const playLandDecision = controller
        .getAvailableDecisions()
        .find((d) => d.type === 'PLAY_LAND' && d.cardId === landCardId);
      expect(playLandDecision).toBeDefined();

      controller.provideDecision({ type: 'PLAY_LAND', cardId: landCardId });

      // Verify land is on battlefield and not tapped
      state = controller.getState();
      expect(state.players[playerOne].hand).toHaveLength(0);
      expect(state.players[playerOne].battlefield).toHaveLength(1);
      expect(state.players[playerOne].battlefield[0]).toBe(landCardId);
      expect(state.cards[landCardId].tapped).toBe(false);

      // Tap land for mana
      expect(controller.isWaitingForDecision()).toBe(true);
      const tapForManaDecision = controller
        .getAvailableDecisions()
        .find(
          (d) => d.type === 'TAP_PERMANENT_FOR_MANA' && d.cardId === landCardId,
        );
      expect(tapForManaDecision).toBeDefined();

      controller.provideDecision({
        type: 'TAP_PERMANENT_FOR_MANA',
        cardId: landCardId,
      });

      // Verify land is tapped and player has mana of the correct color
      state = controller.getState();
      expect(state.cards[landCardId].tapped).toBe(true);
      expect(state.players[playerOne].manaPool[manaColor]).toBe(1);
      expect(state.players[playerOne].battlefield).toContain(landCardId);
    });
  },
);
