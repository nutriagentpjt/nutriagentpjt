import { act, renderHook } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the latest value only after the delay', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'apple', delay: 300 },
    });

    expect(result.current).toBe('apple');

    rerender({ value: 'banana', delay: 300 });
    expect(result.current).toBe('apple');

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('apple');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('banana');
  });
});
