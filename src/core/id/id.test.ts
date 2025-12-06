import crypto from 'node:crypto';
import { makeId } from './id';

describe('makeId', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prefixes generated ids with the provided type', () => {
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-0000-0000-000000000000');

    expect(makeId('card')).toBe('card-00000000-0000-0000-0000-000000000000');
    expect(makeId('player')).toBe('player-00000000-0000-0000-0000-000000000000');
  });

  it('delegates randomness to crypto.randomUUID', () => {
    const spy = jest
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-0000-0000-000000000000');

    makeId('card');

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
