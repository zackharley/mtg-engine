import {
  createSeededRng,
  randomChoice,
  randomFloat,
  randomInt,
  randomSample,
  shuffle,
  shuffleInPlace,
} from './random';

describe('random module', () => {
  describe('createSeededRng', () => {
    it('creates a deterministic RNG with a seed', () => {
      const rng1 = createSeededRng('test-seed');
      const rng2 = createSeededRng('test-seed');

      // Same seed should produce same sequence
      const values1 = [rng1(), rng1(), rng1()];
      const values2 = [rng2(), rng2(), rng2()];

      expect(values1).toEqual(values2);
    });

    it('creates different sequences for different seeds', () => {
      const rng1 = createSeededRng('seed-1');
      const rng2 = createSeededRng('seed-2');

      const value1 = rng1();
      const value2 = rng2();

      expect(value1).not.toBe(value2);
    });

    it('creates non-deterministic RNG without seed', () => {
      const rng1 = createSeededRng();
      const rng2 = createSeededRng();

      // Without seeds, sequences should be different (very high probability)
      const values1 = Array.from({ length: 10 }, () => rng1());
      const values2 = Array.from({ length: 10 }, () => rng2());

      expect(values1).not.toEqual(values2);
    });

    it('generates values in range [0, 1)', () => {
      const rng = createSeededRng('test');
      const values = Array.from({ length: 100 }, () => rng());

      values.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });
    });
  });

  describe('randomInt', () => {
    it('generates integers in the specified range [min, max]', () => {
      const rng = createSeededRng('test');
      const values = Array.from({ length: 100 }, () => randomInt(rng, 1, 6));

      values.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(6);
        expect(Number.isInteger(value)).toBe(true);
      });
    });

    it('handles single value range', () => {
      const rng = createSeededRng('test');
      const value = randomInt(rng, 5, 5);
      expect(value).toBe(5);
    });

    it('is deterministic with same seed', () => {
      const rng1 = createSeededRng('seed');
      const rng2 = createSeededRng('seed');

      const values1 = Array.from({ length: 10 }, () => randomInt(rng1, 1, 100));
      const values2 = Array.from({ length: 10 }, () => randomInt(rng2, 1, 100));

      expect(values1).toEqual(values2);
    });

    it('throws error when min > max', () => {
      const rng = createSeededRng('test');
      expect(() => randomInt(rng, 10, 5)).toThrow('min (10) must be less than or equal to max (5)');
    });
  });

  describe('randomFloat', () => {
    it('generates floats in the specified range [min, max)', () => {
      const rng = createSeededRng('test');
      const values = Array.from({ length: 100 }, () => randomFloat(rng, 0, 10));

      values.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(10);
      });
    });

    it('is deterministic with same seed', () => {
      const rng1 = createSeededRng('seed');
      const rng2 = createSeededRng('seed');

      const values1 = Array.from({ length: 10 }, () => randomFloat(rng1, 0, 1));
      const values2 = Array.from({ length: 10 }, () => randomFloat(rng2, 0, 1));

      expect(values1).toEqual(values2);
    });

    it('throws error when min >= max', () => {
      const rng = createSeededRng('test');
      expect(() => randomFloat(rng, 10, 10)).toThrow('min (10) must be less than max (10)');
      expect(() => randomFloat(rng, 10, 5)).toThrow('min (10) must be less than max (5)');
    });
  });

  describe('randomChoice', () => {
    it('selects an element from a non-empty array', () => {
      const rng = createSeededRng('test');
      const array = [1, 2, 3, 4, 5];
      const choice = randomChoice(rng, array);

      expect(array).toContain(choice);
      expect(choice).toBeDefined();
    });

    it('returns undefined for empty array', () => {
      const rng = createSeededRng('test');
      const choice = randomChoice(rng, []);
      expect(choice).toBeUndefined();
    });

    it('is deterministic with same seed', () => {
      const rng1 = createSeededRng('seed');
      const rng2 = createSeededRng('seed');
      const array = ['a', 'b', 'c', 'd', 'e'];

      const choice1 = randomChoice(rng1, array);
      const choice2 = randomChoice(rng2, array);

      expect(choice1).toBe(choice2);
    });

    it('works with readonly arrays', () => {
      const rng = createSeededRng('test');
      const readonlyArray: readonly number[] = [1, 2, 3];
      const choice = randomChoice(rng, readonlyArray);

      expect(readonlyArray).toContain(choice);
    });
  });

  describe('randomSample', () => {
    it('selects the requested number of unique elements', () => {
      const rng = createSeededRng('test');
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const sample = randomSample(rng, array, 5);

      expect(sample).toHaveLength(5);
      expect(new Set(sample).size).toBe(5); // All unique
      sample.forEach((item) => {
        expect(array).toContain(item);
      });
    });

    it('returns empty array when count is 0', () => {
      const rng = createSeededRng('test');
      const array = [1, 2, 3];
      const sample = randomSample(rng, array, 0);

      expect(sample).toEqual([]);
    });

    it('returns entire array when count >= array.length', () => {
      const rng = createSeededRng('test');
      const array = [1, 2, 3];
      const sample1 = randomSample(rng, array, 3);
      const sample2 = randomSample(rng, array, 10);

      expect(sample1).toHaveLength(3);
      expect(sample2).toHaveLength(3);
    });

    it('is deterministic with same seed', () => {
      const rng1 = createSeededRng('seed');
      const rng2 = createSeededRng('seed');
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const sample1 = randomSample(rng1, array, 5);
      const sample2 = randomSample(rng2, array, 5);

      expect(sample1).toEqual(sample2);
    });

    it('throws error for negative count', () => {
      const rng = createSeededRng('test');
      const array = [1, 2, 3];
      expect(() => randomSample(rng, array, -1)).toThrow('count (-1) must be non-negative');
    });

    it('returns frozen array', () => {
      const rng = createSeededRng('test');
      const array = [1, 2, 3, 4, 5];
      const sample = randomSample(rng, array, 3);

      expect(Object.isFrozen(sample)).toBe(true);
    });
  });

  describe('shuffle', () => {
    it('returns a new array without mutating the original', () => {
      const rng = createSeededRng('test');
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(rng, original);

      expect(shuffled).not.toBe(original);
      expect(original).toEqual([1, 2, 3, 4, 5]);
    });

    it('preserves all elements', () => {
      const rng = createSeededRng('test');
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(rng, original);

      expect(shuffled).toHaveLength(original.length);
      expect([...shuffled].sort()).toEqual([...original].sort());
    });

    it('produces different order than original (high probability)', () => {
      const rng = createSeededRng('test');
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = shuffle(rng, original);

      // With 10 elements, probability of same order is 1/10! ≈ 0.0000003
      // So this should almost always pass
      expect(shuffled).not.toEqual(original);
    });

    it('is deterministic with same seed', () => {
      const rng1 = createSeededRng('seed');
      const rng2 = createSeededRng('seed');
      const array = [1, 2, 3, 4, 5];

      const shuffled1 = shuffle(rng1, array);
      const shuffled2 = shuffle(rng2, array);

      expect(shuffled1).toEqual(shuffled2);
    });

    it('handles empty array', () => {
      const rng = createSeededRng('test');
      const shuffled = shuffle(rng, []);

      expect(shuffled).toEqual([]);
    });

    it('handles single element array', () => {
      const rng = createSeededRng('test');
      const shuffled = shuffle(rng, [42]);

      expect(shuffled).toEqual([42]);
    });

    it('returns frozen array', () => {
      const rng = createSeededRng('test');
      const array = [1, 2, 3, 4, 5];
      const shuffled = shuffle(rng, array);

      expect(Object.isFrozen(shuffled)).toBe(true);
    });

    it('works with readonly arrays', () => {
      const rng = createSeededRng('test');
      const readonlyArray: readonly number[] = [1, 2, 3, 4, 5];
      const shuffled = shuffle(rng, readonlyArray);

      expect(shuffled).toHaveLength(readonlyArray.length);
      expect(Object.isFrozen(shuffled)).toBe(true);
    });
  });

  describe('shuffleInPlace', () => {
    it('mutates the original array', () => {
      const rng = createSeededRng('test');
      const array = [1, 2, 3, 4, 5];
      const originalReference = array;
      const shuffled = shuffleInPlace(rng, array);

      expect(shuffled).toBe(originalReference);
      expect(array).not.toEqual([1, 2, 3, 4, 5]); // Should be shuffled
    });

    it('preserves all elements', () => {
      const rng = createSeededRng('test');
      const array = [1, 2, 3, 4, 5];
      const originalCopy = [...array];
      shuffleInPlace(rng, array);

      expect(array).toHaveLength(originalCopy.length);
      expect(array.sort()).toEqual(originalCopy.sort());
    });

    it('is deterministic with same seed', () => {
      const rng1 = createSeededRng('seed');
      const rng2 = createSeededRng('seed');
      const array1 = [1, 2, 3, 4, 5];
      const array2 = [1, 2, 3, 4, 5];

      shuffleInPlace(rng1, array1);
      shuffleInPlace(rng2, array2);

      expect(array1).toEqual(array2);
    });

    it('handles empty array', () => {
      const rng = createSeededRng('test');
      const array: number[] = [];
      shuffleInPlace(rng, array);

      expect(array).toEqual([]);
    });

    it('handles single element array', () => {
      const rng = createSeededRng('test');
      const array = [42];
      shuffleInPlace(rng, array);

      expect(array).toEqual([42]);
    });
  });

  describe('integration: shuffling deck for MTG', () => {
    it('shuffles a deck of cards deterministically', () => {
      const rng = createSeededRng('game-123');
      const library = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5'];

      const shuffled1 = shuffle(rng, library);
      const shuffled2 = shuffle(createSeededRng('game-123'), library);

      // Same seed produces same shuffle
      expect(shuffled1).toEqual(shuffled2);
      // Original is unchanged
      expect(library).toEqual(['card-1', 'card-2', 'card-3', 'card-4', 'card-5']);
    });

    it('shuffles multiple decks independently', () => {
      const rng1 = createSeededRng('player-1-deck');
      const rng2 = createSeededRng('player-2-deck');
      const deck1 = ['a', 'b', 'c', 'd', 'e'];
      const deck2 = ['a', 'b', 'c', 'd', 'e'];

      const shuffled1 = shuffle(rng1, deck1);
      const shuffled2 = shuffle(rng2, deck2);

      // Different seeds produce different shuffles
      expect(shuffled1).not.toEqual(shuffled2);
    });
  });
});

