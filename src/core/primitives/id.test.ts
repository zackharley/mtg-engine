import { makeCardId, makePlayerId } from './id';

describe('id primitives', () => {
  it('generates branded, unique ids for cards and players', () => {
    const cardA = makeCardId();
    const cardB = makeCardId();
    const player = makePlayerId();

    expect(cardA).not.toBe(cardB);
    expect(cardA).toMatch(/^card-/);
    expect(player).toMatch(/^player-/);
  });
});
