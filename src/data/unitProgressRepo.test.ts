import { describe, expect, it } from 'vitest';
import { applyCheckResult, emptyUnitProgress, markLearned } from './unitProgressRepo';

const T1 = '2026-10-10T09:00:00.000Z';
const T2 = '2026-10-11T09:00:00.000Z';

describe('markLearned', () => {
  it('sets learned_at once and keeps the first time', () => {
    const first = markLearned(emptyUnitProgress('u1', 'b01'), T1);
    expect(first.learned_at).toBe(T1);
    expect(markLearned(first, T2).learned_at).toBe(T1);
  });
});

describe('applyCheckResult', () => {
  it('counts an attempt and records the score on a fail without completing', () => {
    const row = applyCheckResult(emptyUnitProgress('u1', 'b01'), 9, false, T1);
    expect(row).toMatchObject({ attempts: 1, best_score: 9, completed_at: null });
  });

  it('completes the unit on a pass', () => {
    const row = applyCheckResult(emptyUnitProgress('u1', 'b01'), 10, true, T1);
    expect(row).toMatchObject({ attempts: 1, best_score: 10, completed_at: T1 });
  });

  it('keeps the best score and the first completion time on later checks', () => {
    const passed = applyCheckResult(emptyUnitProgress('u1', 'b01'), 11, true, T1);
    const later = applyCheckResult(passed, 7, false, T2);
    expect(later).toMatchObject({ attempts: 2, best_score: 11, completed_at: T1 });
    expect(applyCheckResult(later, 12, true, T2)).toMatchObject({ best_score: 12, completed_at: T1 });
  });

  it('does not mutate the row it was given', () => {
    const row = emptyUnitProgress('u1', 'b01');
    applyCheckResult(row, 12, true, T1);
    expect(row.attempts).toBe(0);
  });
});
