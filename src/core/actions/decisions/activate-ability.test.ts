import { createStateWithCardInHand } from '@/__tests__/test-utils';

import { defineCard } from '../../card/card';
import { parseManaCost } from '../../costs/mana-costs';
import { makePlayerId } from '../../primitives/id';
import { makeStackObjectId } from '../../primitives/id';
import { fromArrayOrderedStack } from '../../primitives/ordered-stack';
import type { StackObject } from '../../stack/stack';
import type { AvailablePlayerDecision } from '../../state/reducer';
import { addActivateAbilityDecisions } from './activate-ability';

describe('activate-ability decisions', () => {
  describe('addActivateAbilityDecisions', () => {
    it('should add ACTIVATE_ABILITY decision for activatable abilities', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: Add {G}.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: true,
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];
      // Move card to battlefield
      state.players[playerId].hand = state.players[playerId].hand.filter(
        (id) => id !== cardId,
      );
      state.players[playerId].battlefield.push(cardId);

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addActivateAbilityDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(1);
      expect(decisions[0]).toEqual({
        type: 'ACTIVATE_ABILITY',
        cardId,
        abilityIndex: 0,
        targets: [],
      });
    });

    it('should not add decision for tapped permanents', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: Add {G}.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: true,
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];
      // Move card to battlefield
      state.players[playerId].hand = state.players[playerId].hand.filter(
        (id) => id !== cardId,
      );
      state.players[playerId].battlefield.push(cardId);
      state.cards[cardId].tapped = true;

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addActivateAbilityDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(0);
    });

    it('should not add decision for abilities with unaffordable mana costs', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-creature',
        name: 'Test Creature',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'activated',
            text: '{R}: Deal 1 damage.',
            cost: [{ kind: 'MANA', manaCost: parseManaCost('{R}') }],
            producesMana: false,
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];
      // Move card to battlefield
      state.players[playerId].hand = state.players[playerId].hand.filter(
        (id) => id !== cardId,
      );
      state.players[playerId].battlefield.push(cardId);
      state.players[playerId].manaPool.R = 0; // No red mana

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addActivateAbilityDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(0);
    });

    it('should add decision for abilities with affordable mana costs', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-creature',
        name: 'Test Creature',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'activated',
            text: '{R}: Deal 1 damage.',
            cost: [{ kind: 'MANA', manaCost: parseManaCost('{R}') }],
            producesMana: false,
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];
      // Move card to battlefield
      state.players[playerId].hand = state.players[playerId].hand.filter(
        (id) => id !== cardId,
      );
      state.players[playerId].battlefield.push(cardId);
      state.players[playerId].manaPool.R = 1; // Has red mana

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addActivateAbilityDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(1);
      expect(decisions[0].type).toBe('ACTIVATE_ABILITY');
    });

    it('should not add decision for abilities requiring insufficient life', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-creature',
        name: 'Test Creature',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'activated',
            text: 'Pay 5 life: Deal 1 damage.',
            cost: [{ kind: 'PAY_LIFE', amount: 5 }],
            producesMana: false,
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];
      // Move card to battlefield
      state.players[playerId].hand = state.players[playerId].hand.filter(
        (id) => id !== cardId,
      );
      state.players[playerId].battlefield.push(cardId);
      state.players[playerId].life = 3; // Not enough life

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addActivateAbilityDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(0);
    });

    it('should add decision for abilities with sufficient life', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-creature',
        name: 'Test Creature',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'activated',
            text: 'Pay 3 life: Deal 1 damage.',
            cost: [{ kind: 'PAY_LIFE', amount: 3 }],
            producesMana: false,
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];
      // Move card to battlefield
      state.players[playerId].hand = state.players[playerId].hand.filter(
        (id) => id !== cardId,
      );
      state.players[playerId].battlefield.push(cardId);
      state.players[playerId].life = 20; // Enough life

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addActivateAbilityDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(1);
      expect(decisions[0].type).toBe('ACTIVATE_ABILITY');
    });

    it('should not add decision for sorcery-speed abilities when stack is not empty', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-creature',
        name: 'Test Creature',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: You gain 1 life.',
            cost: [{ kind: 'TAP_SOURCE' }],
            timing: 'SORCERY_SPEED',
            producesMana: false,
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];
      // Move card to battlefield
      state.players[playerId].hand = state.players[playerId].hand.filter(
        (id) => id !== cardId,
      );
      state.players[playerId].battlefield.push(cardId);
      // Add something to the stack
      const testStackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        effect: jest.fn(),
        targets: [],
      };
      state.stack = fromArrayOrderedStack([testStackObject]);

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addActivateAbilityDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(0);
    });

    it('should add decision for mana abilities even when stack is not empty', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-land',
        name: 'Test Land',
        type: 'land',
        manaCost: parseManaCost(''),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: Add {G}.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: true,
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];
      // Move card to battlefield
      state.players[playerId].hand = state.players[playerId].hand.filter(
        (id) => id !== cardId,
      );
      state.players[playerId].battlefield.push(cardId);
      // Add something to the stack
      const testStackObject: StackObject = {
        id: makeStackObjectId(),
        controllerId: playerId,
        type: 'SPELL',
        effect: jest.fn(),
        targets: [],
      };
      state.stack = fromArrayOrderedStack([testStackObject]);

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addActivateAbilityDecisions(
        state,
        playerId,
        initialDecisions,
      );

      // Mana abilities can be activated even when stack is not empty (rule 605.3a)
      expect(decisions).toHaveLength(1);
      expect(decisions[0].type).toBe('ACTIVATE_ABILITY');
    });

    it('should add multiple decisions for multiple abilities on same permanent', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-creature',
        name: 'Test Creature',
        type: 'creature',
        manaCost: parseManaCost('{1}{G}'),
        abilities: [
          {
            type: 'activated',
            text: 'Tap: You gain 1 life.',
            cost: [{ kind: 'TAP_SOURCE' }],
            producesMana: false,
            effect: jest.fn(),
          },
          {
            type: 'activated',
            text: '{R}: Deal 1 damage.',
            cost: [{ kind: 'MANA', manaCost: parseManaCost('{R}') }],
            producesMana: false,
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];
      // Move card to battlefield
      state.players[playerId].hand = state.players[playerId].hand.filter(
        (id) => id !== cardId,
      );
      state.players[playerId].battlefield.push(cardId);
      state.players[playerId].manaPool.R = 1;

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addActivateAbilityDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(2);
      expect(decisions[0]).toEqual({
        type: 'ACTIVATE_ABILITY',
        cardId,
        abilityIndex: 0,
        targets: [],
      });
      expect(decisions[1]).toEqual({
        type: 'ACTIVATE_ABILITY',
        cardId,
        abilityIndex: 1,
        targets: [],
      });
    });

    it('should not add decisions for non-activated abilities', () => {
      const playerId = makePlayerId();
      const testCard = defineCard({
        scryfallId: 'test-card',
        name: 'Test Card',
        type: 'instant',
        manaCost: parseManaCost('{R}'),
        abilities: [
          {
            type: 'spell',
            text: 'Deal 3 damage',
            effect: jest.fn(),
          },
        ],
      });

      const { state, cardIds } = createStateWithCardInHand(
        playerId,
        testCard,
        1,
      );
      const cardId = cardIds[0];
      // Move card to battlefield
      state.players[playerId].hand = state.players[playerId].hand.filter(
        (id) => id !== cardId,
      );
      state.players[playerId].battlefield.push(cardId);

      const initialDecisions: AvailablePlayerDecision[] = [];
      const decisions = addActivateAbilityDecisions(
        state,
        playerId,
        initialDecisions,
      );

      expect(decisions).toHaveLength(0);
    });
  });
});
