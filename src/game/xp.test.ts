import { describe, expect, it } from 'vitest';
import { ROUND_BONUS, roundScore, xpForQuestion, xpForRound } from './xp';
import type { Outcome, Result } from './types';

const outcome = (result: Result, requeued = false): Outcome => ({ result, requeued, items: [] });

describe('xpForQuestion', () => {
  it('gives 10 for first try, 5 for retry, 0 for missed', () => {
    expect(xpForQuestion('first', false)).toBe(10);
    expect(xpForQuestion('retry', false)).toBe(5);
    expect(xpForQuestion('missed', false)).toBe(0);
  });

  it('gives 0 for any re-queued attempt', () => {
    expect(xpForQuestion('first', true)).toBe(0);
    expect(xpForQuestion('retry', true)).toBe(0);
    expect(xpForQuestion('missed', true)).toBe(0);
  });
});

describe('xpForRound', () => {
  it('adds the 20 point completion bonus', () => {
    expect(ROUND_BONUS).toBe(20);
    expect(xpForRound([])).toBe(20);
  });

  it('sums question XP plus bonus (AC14)', () => {
    const outcomes = [
      ...Array.from({ length: 6 }, () => outcome('first')),
      outcome('retry'),
      outcome('retry'),
      outcome('missed'),
      outcome('missed'),
    ];
    expect(xpForRound(outcomes)).toBe(6 * 10 + 2 * 5 + 20);
  });

  it('ignores re-queued attempts', () => {
    const outcomes = [outcome('first'), outcome('missed'), outcome('first', true)];
    expect(xpForRound(outcomes)).toBe(10 + 20);
  });
});

describe('roundScore', () => {
  it('counts first-try and retry as correct, excludes re-queued attempts', () => {
    const outcomes = [outcome('first'), outcome('retry'), outcome('missed'), outcome('first', true)];
    expect(roundScore(outcomes)).toBe(2);
  });
});
