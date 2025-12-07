/**
 * Random number generation module for game engine operations.
 *
 * Provides seeded random number generation for:
 * - Shuffling decks (Rule 103.3, 701.24)
 * - Random selection of cards/objects
 * - Other RNG-dependent game mechanics
 *
 * All functions are pure and composable. Seeded RNG ensures
 * deterministic behavior for testing and game replay.
 */

import seedrandom from 'seedrandom';

/**
 * A seeded random number generator function.
 * Returns a value in the range [0, 1).
 */
export type SeededRng = () => number;

/**
 * Creates a seeded random number generator.
 * If no seed is provided, uses a random seed (non-deterministic).
 * With a seed, the sequence is deterministic and reproducible.
 *
 * @param seed - Optional seed string for deterministic RNG. If omitted, uses Math.random.
 * @returns A seeded random number generator function
 *
 * @example
 * ```ts
 * const rng = createSeededRng('my-seed');
 * const value = rng(); // Always same sequence for same seed
 * ```
 */
export function createSeededRng(seed?: string): SeededRng {
  if (seed === undefined) {
    // Use Math.random for non-deterministic behavior
    return () => Math.random();
  }
  const rng = seedrandom(seed);
  return () => rng();
}

/**
 * Generates a random integer in the range [min, max] (inclusive).
 *
 * @param rng - The seeded random number generator
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns A random integer between min and max
 *
 * @example
 * ```ts
 * const rng = createSeededRng('seed');
 * const roll = randomInt(rng, 1, 6); // Roll a die: 1-6
 * ```
 */
export function randomInt(rng: SeededRng, min: number, max: number): number {
  if (min > max) {
    throw new Error(`min (${min}) must be less than or equal to max (${max})`);
  }
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Generates a random floating-point number in the range [min, max).
 *
 * @param rng - The seeded random number generator
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns A random float between min and max
 */
export function randomFloat(
  rng: SeededRng,
  min: number,
  max: number,
): number {
  if (min >= max) {
    throw new Error(`min (${min}) must be less than max (${max})`);
  }
  return rng() * (max - min) + min;
}

/**
 * Randomly selects an element from an array.
 *
 * @param rng - The seeded random number generator
 * @param array - The array to select from
 * @returns A randomly selected element, or undefined if array is empty
 *
 * @example
 * ```ts
 * const rng = createSeededRng('seed');
 * const card = randomChoice(rng, [card1, card2, card3]);
 * ```
 */
export function randomChoice<T>(
  rng: SeededRng,
  array: readonly T[],
): T | undefined {
  if (array.length === 0) {
    return undefined;
  }
  const index = randomInt(rng, 0, array.length - 1);
  return array[index];
}

/**
 * Randomly selects multiple unique elements from an array.
 *
 * @param rng - The seeded random number generator
 * @param array - The array to select from
 * @param count - Number of elements to select
 * @returns An array of randomly selected unique elements
 *
 * @example
 * ```ts
 * const rng = createSeededRng('seed');
 * const hand = randomSample(rng, library, 7); // Draw 7 unique cards
 * ```
 */
export function randomSample<T>(
  rng: SeededRng,
  array: readonly T[],
  count: number,
): readonly T[] {
  if (count < 0) {
    throw new Error(`count (${count}) must be non-negative`);
  }
  if (count === 0) {
    return [];
  }
  if (count >= array.length) {
    return array;
  }

  // Use Fisher-Yates to select count elements
  const result: T[] = [];
  const indices = new Set<number>();

  while (indices.size < count) {
    const index = randomInt(rng, 0, array.length - 1);
    if (!indices.has(index)) {
      indices.add(index);
      result.push(array[index]);
    }
  }

  return Object.freeze(result);
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * Returns a new shuffled array without mutating the original.
 *
 * Per MTG Rule 701.24a: "To shuffle a library or a face-down pile of cards,
 * randomize the cards within it so that no player knows their order."
 *
 * @param rng - The seeded random number generator
 * @param array - The array to shuffle
 * @returns A new array with elements in random order
 *
 * @example
 * ```ts
 * const rng = createSeededRng('seed');
 * const shuffled = shuffle(rng, library);
 * ```
 */
export function shuffle<T>(
  rng: SeededRng,
  array: readonly T[],
): readonly T[] {
  // Create a mutable copy for Fisher-Yates
  const shuffled = [...array];

  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(rng, 0, i);
    // Swap elements at positions i and j
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return Object.freeze(shuffled);
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * Mutates the original array. Use only when mutation is acceptable.
 *
 * @param rng - The seeded random number generator
 * @param array - The array to shuffle (will be mutated)
 * @returns The same array reference (for chaining)
 */
export function shuffleInPlace<T>(rng: SeededRng, array: T[]): T[] {
  // Fisher-Yates shuffle algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(rng, 0, i);
    // Swap elements at positions i and j
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

