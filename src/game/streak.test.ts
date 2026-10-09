import { describe, expect, it } from 'vitest';
import { addDays, displayStreak, nextStreak, toLocalDateString, type StreakState } from './streak';

const state = (current: number, longest: number, last: string | null): StreakState => ({
  current_streak: current,
  longest_streak: longest,
  last_active_date: last,
});

describe('toLocalDateString', () => {
  it('uses local date parts', () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toLocalDateString(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31');
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('nextStreak', () => {
  it('starts at 1 for a first-ever round', () => {
    expect(nextStreak(state(0, 0, null), '2026-10-09')).toEqual(state(1, 1, '2026-10-09'));
  });

  it('is unchanged on the same day', () => {
    expect(nextStreak(state(3, 5, '2026-10-09'), '2026-10-09')).toEqual(state(3, 5, '2026-10-09'));
  });

  it('increments when last active yesterday (AC15)', () => {
    expect(nextStreak(state(3, 3, '2026-10-08'), '2026-10-09')).toEqual(state(4, 4, '2026-10-09'));
  });

  it('resets to 1 after a gap (AC16)', () => {
    expect(nextStreak(state(7, 7, '2026-10-06'), '2026-10-09')).toEqual(state(1, 7, '2026-10-09'));
  });

  it('tracks the longest streak', () => {
    expect(nextStreak(state(4, 4, '2026-10-08'), '2026-10-09').longest_streak).toBe(5);
    expect(nextStreak(state(2, 9, '2026-10-08'), '2026-10-09').longest_streak).toBe(9);
  });

  it('handles month and year boundaries', () => {
    expect(nextStreak(state(2, 2, '2026-09-30'), '2026-10-01').current_streak).toBe(3);
    expect(nextStreak(state(2, 2, '2026-12-31'), '2027-01-01').current_streak).toBe(3);
    expect(nextStreak(state(2, 2, '2028-02-29'), '2028-03-01').current_streak).toBe(3);
  });
});

describe('displayStreak', () => {
  it('shows the streak when active today or yesterday', () => {
    expect(displayStreak(state(3, 3, '2026-10-09'), '2026-10-09')).toBe(3);
    expect(displayStreak(state(3, 3, '2026-10-08'), '2026-10-09')).toBe(3);
  });

  it('shows 0 when the last activity was before yesterday (AC16)', () => {
    expect(displayStreak(state(3, 3, '2026-10-06'), '2026-10-09')).toBe(0);
  });

  it('shows 0 for a learner who has never played', () => {
    expect(displayStreak(state(0, 0, null), '2026-10-09')).toBe(0);
  });
});
