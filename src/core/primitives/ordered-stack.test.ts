import {
  createOrderedStack,
  fromArrayOrderedStack,
  isEmptyOrderedStack,
  peekOrderedStack,
  popOrderedStack,
  pushOrderedStack,
  sizeOrderedStack,
  toArrayOrderedStack,
} from './ordered-stack';

describe('ordered-stack', () => {
  describe('createOrderedStack', () => {
    it('creates empty frozen stack', () => {
      const stack = createOrderedStack();

      expect(stack).toHaveLength(0);
      expect(Object.isFrozen(stack)).toBe(true);
    });
  });

  describe('pushOrderedStack', () => {
    it('adds element to top of stack', () => {
      const stack = createOrderedStack();
      const newStack = pushOrderedStack(stack, 1);

      expect(newStack).toHaveLength(1);
      expect(newStack[0]).toBe(1);
      expect(Object.isFrozen(newStack)).toBe(true);
    });

    it('returns new stack instance (immutability)', () => {
      const stack = createOrderedStack();
      const newStack = pushOrderedStack(stack, 1);

      expect(newStack).not.toBe(stack);
    });

    it('adds multiple elements in order', () => {
      const stack = createOrderedStack();
      const stack1 = pushOrderedStack(stack, 1);
      const stack2 = pushOrderedStack(stack1, 2);
      const stack3 = pushOrderedStack(stack2, 3);

      expect(stack3).toEqual([1, 2, 3]);
      expect(stack3[stack3.length - 1]).toBe(3); // Top is last element
    });
  });

  describe('pushOrderedStack with array', () => {
    it('adds multiple elements in order', () => {
      const stack = createOrderedStack();
      const newStack = pushOrderedStack(stack, [1, 2, 3]);

      expect(newStack).toEqual([1, 2, 3]);
      expect(Object.isFrozen(newStack)).toBe(true);
    });

    it('preserves order of elements', () => {
      const stack = createOrderedStack();
      const newStack = pushOrderedStack(stack, [3, 1, 2]);

      expect(newStack).toEqual([3, 1, 2]);
    });
  });

  describe('popOrderedStack', () => {
    it('removes top element and returns tuple', () => {
      const stack = pushOrderedStack(createOrderedStack(), 1);
      const [newStack, popped] = popOrderedStack(stack);

      expect(newStack).toHaveLength(0);
      expect(popped).toBe(1);
    });

    it('returns undefined when stack is empty', () => {
      const stack = createOrderedStack();
      const [newStack, popped] = popOrderedStack(stack);

      expect(newStack).toHaveLength(0);
      expect(popped).toBeUndefined();
    });

    it('returns new stack instance (immutability)', () => {
      const stack = pushOrderedStack(createOrderedStack(), 1);
      const [newStack] = popOrderedStack(stack);

      expect(newStack).not.toBe(stack);
    });

    it('removes from top (last element)', () => {
      const stack = pushOrderedStack(createOrderedStack(), [1, 2, 3]);
      const [newStack, popped] = popOrderedStack(stack);

      expect(popped).toBe(3);
      expect(newStack).toEqual([1, 2]);
    });
  });

  describe('peekOrderedStack', () => {
    it('returns top element without removing', () => {
      const stack = pushOrderedStack(createOrderedStack(), [1, 2, 3]);
      const top = peekOrderedStack(stack);

      expect(top).toBe(3);
      expect(stack).toHaveLength(3);
    });

    it('returns undefined when stack is empty', () => {
      const stack = createOrderedStack();
      const top = peekOrderedStack(stack);

      expect(top).toBeUndefined();
    });
  });

  describe('isEmptyOrderedStack', () => {
    it('returns true for empty stack', () => {
      const stack = createOrderedStack();

      expect(isEmptyOrderedStack(stack)).toBe(true);
    });

    it('returns false for non-empty stack', () => {
      const stack = pushOrderedStack(createOrderedStack(), 1);

      expect(isEmptyOrderedStack(stack)).toBe(false);
    });
  });

  describe('sizeOrderedStack', () => {
    it('returns 0 for empty stack', () => {
      const stack = createOrderedStack();

      expect(sizeOrderedStack(stack)).toBe(0);
    });

    it('returns correct size for non-empty stack', () => {
      const stack = pushOrderedStack(createOrderedStack(), [1, 2, 3]);

      expect(sizeOrderedStack(stack)).toBe(3);
    });
  });

  describe('toArrayOrderedStack', () => {
    it('returns readonly array of all elements', () => {
      const stack = pushOrderedStack(createOrderedStack(), [1, 2, 3]);
      const array = toArrayOrderedStack(stack);

      expect(array).toEqual([1, 2, 3]);
      expect(Object.isFrozen(array)).toBe(true);
    });
  });

  describe('fromArrayOrderedStack', () => {
    it('creates stack from array', () => {
      const array = [1, 2, 3];
      const stack = fromArrayOrderedStack(array);

      expect(stack).toEqual([1, 2, 3]);
      expect(Object.isFrozen(stack)).toBe(true);
    });

    it('creates new frozen instance', () => {
      const array = [1, 2, 3];
      const stack = fromArrayOrderedStack(array);

      expect(stack).not.toBe(array);
      expect(Object.isFrozen(stack)).toBe(true);
    });
  });

  describe('immutability', () => {
    it('all operations return new instances', () => {
      const stack1 = createOrderedStack();
      const stack2 = pushOrderedStack(stack1, 1);
      const stack3 = pushOrderedStack(stack2, 2);
      const [stack4] = popOrderedStack(stack3);

      expect(stack1).not.toBe(stack2);
      expect(stack2).not.toBe(stack3);
      expect(stack3).not.toBe(stack4);
      expect(stack1).toHaveLength(0);
      expect(stack2).toHaveLength(1);
      expect(stack3).toHaveLength(2);
      expect(stack4).toHaveLength(1);
    });
  });
});
