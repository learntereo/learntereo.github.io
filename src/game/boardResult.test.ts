import { describe, expect, it } from 'vitest';
import { REVEAL_AFTER, boardResult, shouldReveal } from './boardResult';

describe('shouldReveal', () => {
  it('reveals after 2 wrong drops (AC7)', () => {
    expect(REVEAL_AFTER).toBe(2);
    expect(shouldReveal(0)).toBe(false);
    expect(shouldReveal(1)).toBe(false);
    expect(shouldReveal(2)).toBe(true);
    expect(shouldReveal(3)).toBe(true);
  });
});

describe('boardResult', () => {
  it('is first when there are no wrong drops', () => {
    expect(boardResult({}, [])).toBe('first');
    expect(boardResult({ a: 0, b: 0 }, [])).toBe('first');
  });

  it('is retry when there are wrong drops but no reveals', () => {
    expect(boardResult({ a: 1 }, [])).toBe('retry');
    expect(boardResult({ a: 1, b: 1 }, [])).toBe('retry');
  });

  it('is missed when any word was revealed', () => {
    expect(boardResult({ a: 2 }, ['a'])).toBe('missed');
    expect(boardResult({ a: 1, b: 2 }, ['b'])).toBe('missed');
  });
});
