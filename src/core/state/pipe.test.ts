import { pipe } from '@/lib/pipe';

describe('pipe', () => {
  it('applies single mutation', () => {
    const value = { value: 1 };
    const mutation = (v: typeof value) => {
      v.value = 2;
      return v;
    };

    const result = pipe(value, mutation);

    expect(result.value).toBe(2);
  });

  it('applies multiple mutations in sequence', () => {
    const value = { value: 1 };
    const mutation1 = (v: typeof value) => {
      v.value = v.value + 1;
      return v;
    };
    const mutation2 = (v: typeof value) => {
      v.value = v.value * 2;
      return v;
    };
    const mutation3 = (v: typeof value) => {
      v.value = v.value - 1;
      return v;
    };

    const result = pipe(value, mutation1, mutation2, mutation3);

    expect(result.value).toBe(3); // (1 + 1) * 2 - 1 = 3
  });

  it('handles empty mutations array', () => {
    const value = { value: 1 };

    const result = pipe(value);

    expect(result).toBe(value);
  });

  it('passes result of previous mutation to next', () => {
    const value = { count: 0 };
    const addOne = (v: typeof value) => {
      v.count = v.count + 1;
      return v;
    };
    const multiplyByTwo = (v: typeof value) => {
      v.count = v.count * 2;
      return v;
    };

    const result = pipe(value, addOne, multiplyByTwo);

    expect(result.count).toBe(2); // (0 + 1) * 2 = 2
  });

  it('works with complex nested objects', () => {
    const value = { nested: { value: 1 } };
    const mutation1 = (v: typeof value) => {
      v.nested.value = 2;
      return v;
    };
    const mutation2 = (v: typeof value) => {
      v.nested.value = v.nested.value * 3;
      return v;
    };

    const result = pipe(value, mutation1, mutation2);

    expect(result.nested.value).toBe(6);
  });
});
