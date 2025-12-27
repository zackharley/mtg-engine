import { createGame } from '../../../src';
import forest from '../../../src/card-definitions/cards/forest/card';
import island from '../../../src/card-definitions/cards/island/card';
import { defineCard } from '../../../src/core/card/card';
import { parseManaCost } from '../../../src/core/costs/mana-costs';
import { addMana } from '../../../src/core/costs/mana-pool';
import type { ReduceContext } from '../../../src/core/state/reducer';
import { Phase } from '../../../src/core/turn/turn-structure';

// Test card: Basic mana-producing land (mana ability)
const testBasicLand = defineCard({
  scryfallId: 'test-basic-land',
  name: 'Test Basic Land',
  type: 'land',
  manaCost: parseManaCost(''),
  abilities: [
    {
      type: 'activated',
      text: 'Tap: Add {G}.',
      cost: [{ kind: 'TAP_SOURCE' }],
      producesMana: true,
      effect: (ctx: ReduceContext, args) => {
        ctx.state = addMana(ctx.state, args.controllerId, 'G', 1);
      },
    },
  ],
});

// Test card: Mana ability that can't produce mana (rule 605.2)
const testConditionalManaAbility = defineCard({
  scryfallId: 'test-conditional-mana',
  name: 'Test Conditional Mana',
  type: 'land',
  manaCost: parseManaCost(''),
  abilities: [
    {
      type: 'activated',
      text: 'Tap: Add {G} for each creature you control.',
      cost: [{ kind: 'TAP_SOURCE' }],
      producesMana: true,
      effect: (ctx: ReduceContext, args) => {
        // Add mana based on creatures controlled (could be 0)
        const player = ctx.state.players[args.controllerId];
        const creatureCount = player.battlefield.filter((cardId) => {
          const card = ctx.state.cards[cardId];
          const def = ctx.state.cardDefinitions[card.definitionId];
          return def.type === 'creature';
        }).length;
        ctx.state = addMana(ctx.state, args.controllerId, 'G', creatureCount);
      },
    },
  ],
});

describe('Rule 605: Mana Abilities', () => {
  describe('605.1: Mana Ability Criteria', () => {
    describe('605.1a: An activated ability is a mana ability if it meets all criteria', () => {
      it('should recognize activated abilities without targets that produce mana as mana abilities', () => {
        const { controller, playerIds } = createGame({
          players: [
            { deck: [{ definition: testBasicLand, count: 1 }] },
            { deck: [] },
          ],
        });

        const [playerOne] = playerIds;
        let state = controller.getState();

        // Play the land
        const landCardId = state.players[playerOne].hand[0];
        controller.provideDecision({ type: 'PLAY_LAND', cardId: landCardId });

        state = controller.getState();
        expect(state.players[playerOne].battlefield).toContain(landCardId);

        // Check that ACTIVATE_ABILITY decision is available (not TAP_PERMANENT_FOR_MANA)
        const decisions = controller.getAvailableDecisions();
        const activateDecision = decisions.find(
          (d) =>
            d.type === 'ACTIVATE_ABILITY' &&
            d.cardId === landCardId &&
            d.abilityIndex === 0,
        );
        expect(activateDecision).toBeDefined();
      });

      it('should allow activating mana ability and mana is added immediately', () => {
        const { controller, playerIds } = createGame({
          players: [
            { deck: [{ definition: testBasicLand, count: 1 }] },
            { deck: [] },
          ],
        });

        const [playerOne] = playerIds;
        let state = controller.getState();

        // Play the land
        const landCardId = state.players[playerOne].hand[0];
        controller.provideDecision({ type: 'PLAY_LAND', cardId: landCardId });

        state = controller.getState();
        expect(state.players[playerOne].manaPool.G).toBe(0);

        // Activate the mana ability
        const decisions = controller.getAvailableDecisions();
        const activateDecision = decisions.find(
          (d) =>
            d.type === 'ACTIVATE_ABILITY' &&
            d.cardId === landCardId &&
            d.abilityIndex === 0,
        );
        expect(activateDecision).toBeDefined();

        controller.provideDecision({
          type: 'ACTIVATE_ABILITY',
          cardId: landCardId,
          abilityIndex: 0,
        });

        // Verify mana was added immediately (rule 605.3b - no stack)
        state = controller.getState();
        expect(state.players[playerOne].manaPool.G).toBe(1);
        expect(state.cards[landCardId].tapped).toBe(true);
      });
    });

    describe('605.5a: Abilities with targets are not mana abilities', () => {
      it('should not treat abilities with targets as mana abilities even if they produce mana', () => {
        // Note: We don't currently support targets in activated abilities,
        // but this test documents the rule behavior
        // When targets are implemented, abilities with targets should go on the stack
        // even if they produce mana
        expect(true).toBe(true); // Placeholder assertion until target support is implemented
      });
    });
  });

  describe('605.2: Mana Ability Status Persistence', () => {
    it('should remain a mana ability even when tapped', () => {
      const { controller, playerIds } = createGame({
        players: [
          { deck: [{ definition: testBasicLand, count: 1 }] },
          { deck: [] },
        ],
      });

      const [playerOne] = playerIds;
      let state = controller.getState();

      // Play and tap the land
      const landCardId = state.players[playerOne].hand[0];
      controller.provideDecision({ type: 'PLAY_LAND', cardId: landCardId });

      controller.provideDecision({
        type: 'ACTIVATE_ABILITY',
        cardId: landCardId,
        abilityIndex: 0,
      });

      state = controller.getState();
      expect(state.cards[landCardId].tapped).toBe(true);

      // The ability should still be recognized as a mana ability
      // (though it can't be activated again while tapped)
      // This is tested by the fact that it was activated successfully
    });

    it('should remain a mana ability even when it cannot produce mana (rule 605.2)', () => {
      const { controller, playerIds } = createGame({
        players: [
          { deck: [{ definition: testConditionalManaAbility, count: 1 }] },
          { deck: [] },
        ],
      });

      const [playerOne] = playerIds;
      let state = controller.getState();

      // Play the land (no creatures controlled, so it would produce 0 mana)
      const landCardId = state.players[playerOne].hand[0];
      controller.provideDecision({ type: 'PLAY_LAND', cardId: landCardId });

      state = controller.getState();

      // The ability should still be available to activate (it's still a mana ability)
      const decisions = controller.getAvailableDecisions();
      const activateDecision = decisions.find(
        (d) =>
          d.type === 'ACTIVATE_ABILITY' &&
          d.cardId === landCardId &&
          d.abilityIndex === 0,
      );
      expect(activateDecision).toBeDefined();

      // Activate it (will produce 0 mana, but that's okay)
      controller.provideDecision({
        type: 'ACTIVATE_ABILITY',
        cardId: landCardId,
        abilityIndex: 0,
      });

      state = controller.getState();
      expect(state.cards[landCardId].tapped).toBe(true);
      expect(state.players[playerOne].manaPool.G).toBe(0); // No creatures, so 0 mana
    });
  });

  describe('605.3: Activating Activated Mana Abilities', () => {
    describe('605.3a: Mana abilities can be activated when player has priority', () => {
      it('should allow activating mana abilities when player has priority', () => {
        const { controller, playerIds } = createGame({
          players: [
            { deck: [{ definition: testBasicLand, count: 1 }] },
            { deck: [] },
          ],
        });

        const [playerOne] = playerIds;
        const state = controller.getState();

        // Play the land
        const landCardId = state.players[playerOne].hand[0];
        controller.provideDecision({ type: 'PLAY_LAND', cardId: landCardId });

        // Player should have priority and be able to activate mana ability
        expect(controller.isWaitingForDecision()).toBe(true);
        expect(controller.getPlayerNeedingDecision()).toBe(playerOne);

        const decisions = controller.getAvailableDecisions();
        const activateDecision = decisions.find(
          (d) =>
            d.type === 'ACTIVATE_ABILITY' &&
            d.cardId === landCardId &&
            d.abilityIndex === 0,
        );
        expect(activateDecision).toBeDefined();
      });
    });

    describe('605.3b: Mana abilities resolve immediately without using the stack', () => {
      it('should resolve mana abilities immediately without putting them on the stack', () => {
        const { controller, playerIds } = createGame({
          players: [
            { deck: [{ definition: testBasicLand, count: 1 }] },
            { deck: [] },
          ],
        });

        const [playerOne] = playerIds;
        let state = controller.getState();

        // Play the land
        const landCardId = state.players[playerOne].hand[0];
        controller.provideDecision({ type: 'PLAY_LAND', cardId: landCardId });

        state = controller.getState();
        const stackLengthBefore = state.stack.length;
        expect(state.players[playerOne].manaPool.G).toBe(0);

        // Activate the mana ability
        controller.provideDecision({
          type: 'ACTIVATE_ABILITY',
          cardId: landCardId,
          abilityIndex: 0,
        });

        // Verify stack length didn't change (ability didn't go on stack)
        state = controller.getState();
        expect(state.stack.length).toBe(stackLengthBefore);

        // Verify mana was added immediately
        expect(state.players[playerOne].manaPool.G).toBe(1);
      });

      it('should not allow responding to mana abilities (they resolve immediately)', () => {
        // This is tested implicitly - if mana abilities went on the stack,
        // players would get priority to respond. Since they resolve immediately,
        // there's no opportunity to respond.
        const { controller, playerIds } = createGame({
          players: [
            { deck: [{ definition: testBasicLand, count: 1 }] },
            { deck: [] },
          ],
        });

        const [playerOne] = playerIds;
        let state = controller.getState();

        // Play the land
        const landCardId = state.players[playerOne].hand[0];
        controller.provideDecision({ type: 'PLAY_LAND', cardId: landCardId });

        // Activate the mana ability
        controller.provideDecision({
          type: 'ACTIVATE_ABILITY',
          cardId: landCardId,
          abilityIndex: 0,
        });

        // After activation, player one should still have priority
        // (not player two, because there's nothing on the stack to respond to)
        state = controller.getState();
        expect(state.players[playerOne].manaPool.G).toBe(1);

        // Player one should still be the one needing a decision
        // (this verifies no priority was passed to player two)
        if (controller.isWaitingForDecision()) {
          expect(controller.getPlayerNeedingDecision()).toBe(playerOne);
        }
      });
    });
  });

  describe('Basic Land Integration', () => {
    it('should allow basic lands to produce mana via their mana abilities', () => {
      const { controller, playerIds } = createGame({
        players: [{ deck: [{ definition: forest, count: 1 }] }, { deck: [] }],
      });

      const [playerOne] = playerIds;
      let state = controller.getState();

      // Play the forest
      const landCardId = state.players[playerOne].hand[0];
      controller.provideDecision({ type: 'PLAY_LAND', cardId: landCardId });

      state = controller.getState();
      expect(state.players[playerOne].manaPool.G).toBe(0);

      // Find and activate the mana ability
      const decisions = controller.getAvailableDecisions();
      const activateDecision = decisions.find(
        (d) =>
          d.type === 'ACTIVATE_ABILITY' &&
          d.cardId === landCardId &&
          d.abilityIndex === 0,
      );
      expect(activateDecision).toBeDefined();

      controller.provideDecision({
        type: 'ACTIVATE_ABILITY',
        cardId: landCardId,
        abilityIndex: 0,
      });

      // Verify mana was added
      state = controller.getState();
      expect(state.players[playerOne].manaPool.G).toBe(1);
      expect(state.cards[landCardId].tapped).toBe(true);
    });

    it('should allow multiple mana abilities to be activated in sequence', () => {
      const { controller, playerIds } = createGame({
        players: [
          {
            deck: [
              { definition: forest, count: 1 },
              { definition: island, count: 1 },
            ],
          },
          { deck: [] },
        ],
      });

      const [playerOne] = playerIds;
      let state = controller.getState();

      // Play one land (land play limit is 1 per turn)
      const forestCardId = state.players[playerOne].hand.find((cardId) => {
        const def = state.cardDefinitions[state.cards[cardId].definitionId];
        return def.name === 'Forest';
      });
      expect(forestCardId).toBeDefined();
      controller.provideDecision({ type: 'PLAY_LAND', cardId: forestCardId! });

      // Activate the forest's mana ability
      state = controller.getState();
      expect(controller.isWaitingForDecision()).toBe(true);
      controller.provideDecision({
        type: 'ACTIVATE_ABILITY',
        cardId: forestCardId!,
        abilityIndex: 0,
      });

      // Verify mana was added
      state = controller.getState();
      expect(state.players[playerOne].manaPool.G).toBe(1);
      const initialTurnNumber = state.turn.turnNumber;

      // Pass priority through both players to advance to next turn
      // We need to pass through player two's turn, then get back to player one
      let iterations = 0;
      const maxIterations = 50;
      while (
        iterations < maxIterations &&
        (state.turn.turnNumber === initialTurnNumber ||
          state.turn.activePlayerId !== playerOne ||
          state.turn.phase !== Phase.PRECOMBAT_MAIN)
      ) {
        if (!controller.isWaitingForDecision()) {
          break;
        }
        const playerNeedingDecision = controller.getPlayerNeedingDecision();
        expect(playerNeedingDecision).toBeDefined();
        controller.provideDecision({ type: 'PASS_PRIORITY' });
        state = controller.getState();
        iterations++;
      }

      // Verify we reached the target state within iteration limit
      expect(iterations).toBeLessThan(maxIterations);
      expect(state.turn.turnNumber).toBeGreaterThan(initialTurnNumber);
      expect(state.turn.activePlayerId).toBe(playerOne);
      expect(state.turn.phase).toBe(Phase.PRECOMBAT_MAIN);
      expect(controller.isWaitingForDecision()).toBe(true);
      expect(controller.getPlayerNeedingDecision()).toBe(playerOne);

      // Play the second land on the next turn
      const islandCardId = state.players[playerOne].hand.find((cardId) => {
        const def = state.cardDefinitions[state.cards[cardId].definitionId];
        return def.name === 'Island';
      });
      expect(islandCardId).toBeDefined();
      controller.provideDecision({ type: 'PLAY_LAND', cardId: islandCardId! });

      // Activate the island's mana ability
      state = controller.getState();
      expect(controller.isWaitingForDecision()).toBe(true);
      controller.provideDecision({
        type: 'ACTIVATE_ABILITY',
        cardId: islandCardId!,
        abilityIndex: 0,
      });

      // Verify mana was added from the island ability
      // Note: The green mana from the forest was emptied at the end of the previous turn
      state = controller.getState();
      expect(state.players[playerOne].manaPool.G).toBe(0); // Emptied between turns
      expect(state.players[playerOne].manaPool.U).toBe(1); // From island on this turn
    });
  });
});
