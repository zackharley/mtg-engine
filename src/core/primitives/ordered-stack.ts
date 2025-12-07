/**
 * Generic immutable stack primitive for ordered collections.
 *
 * This primitive can be used for:
 * - MTG Stack (spells/abilities waiting to resolve)
 * - Library (ordered deck of cards)
 * - Graveyard (ordered discard pile)
 * - Any other ordered list where items are added/removed from the top
 *
 * The stack follows LIFO (Last In, First Out) semantics where:
 * - The "top" is the last element in the array (highest index)
 * - Push adds to the top
 * - Pop removes from the top
 *
 * All operations are immutable and return new instances.
 */

/**
 * An immutable ordered stack of elements of type T.
 * The last element in the array represents the "top" of the stack.
 */
export type OrderedStack<T> = readonly T[];

/**
 * Creates an empty ordered stack.
 */
export function createOrderedStack<T>(): OrderedStack<T> {
  return Object.freeze([]);
}

function isReadonlyArray<T>(value: T | readonly T[]): value is readonly T[] {
  return Array.isArray(value);
}

/**
 * Pushes an element onto the top of the stack, returning a new stack instance.
 * Does not mutate the original stack.
 *
 * @param stack - The current stack
 * @param element - The element to push onto the stack
 * @returns A new stack with the element added to the top
 */
export function pushOrderedStack<T>(
  stack: OrderedStack<T>,
  element: T,
): OrderedStack<T>;
/**
 * Pushes multiple elements onto the top of the stack in order.
 * The first element in the array will be at the bottom, the last at the top.
 *
 * @param stack - The current stack
 * @param elements - The elements to push onto the stack
 * @returns A new stack with the elements added to the top
 */
export function pushOrderedStack<T>(
  stack: OrderedStack<T>,
  elements: readonly T[],
): OrderedStack<T>;
export function pushOrderedStack<T>(
  stack: OrderedStack<T>,
  elementOrElements: T | readonly T[],
): OrderedStack<T> {
  if (isReadonlyArray(elementOrElements)) {
    return Object.freeze([...stack, ...elementOrElements]);
  }
  return Object.freeze([...stack, elementOrElements]);
}

/**
 * Pops the top element from the stack, returning a tuple of [newStack, poppedElement].
 * Returns undefined for the popped element if the stack is empty.
 * Does not mutate the original stack.
 *
 * @param stack - The current stack
 * @returns A tuple containing the new stack and the popped element (or undefined if empty)
 */
export function popOrderedStack<T>(
  stack: OrderedStack<T>,
): [newStack: OrderedStack<T>, poppedElement: T | undefined] {
  if (stack.length === 0) {
    return [stack, undefined];
  }
  const newStack = Object.freeze(stack.slice(0, -1));
  const poppedElement = stack[stack.length - 1];
  return [newStack, poppedElement];
}

/**
 * Peeks at the top element of the stack without removing it.
 * Returns undefined if the stack is empty.
 *
 * @param stack - The current stack
 * @returns The top element or undefined if the stack is empty
 */
export function peekOrderedStack<T>(stack: OrderedStack<T>): T | undefined {
  return stack.length > 0 ? stack[stack.length - 1] : undefined;
}

/**
 * Checks if the stack is empty.
 *
 * @param stack - The current stack
 * @returns True if the stack is empty, false otherwise
 */
export function isEmptyOrderedStack<T>(stack: OrderedStack<T>): boolean {
  return stack.length === 0;
}

/**
 * Gets the number of elements in the stack.
 *
 * @param stack - The current stack
 * @returns The number of elements in the stack
 */
export function sizeOrderedStack<T>(stack: OrderedStack<T>): number {
  return stack.length;
}

/**
 * Gets all elements in the stack as a readonly array.
 * The array is ordered from bottom to top (first element is bottom, last is top).
 *
 * @param stack - The current stack
 * @returns A readonly array of all elements
 */
export function toArrayOrderedStack<T>(stack: OrderedStack<T>): readonly T[] {
  return stack;
}

/**
 * Creates an ordered stack from an array of elements.
 * The first element in the array becomes the bottom, the last becomes the top.
 *
 * @param elements - The elements to create the stack from
 * @returns A new ordered stack
 */
export function fromArrayOrderedStack<T>(
  elements: readonly T[],
): OrderedStack<T> {
  return Object.freeze([...elements]);
}
