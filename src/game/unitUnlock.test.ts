import { describe, expect, it } from 'vitest';
import type { Unit } from './types';
import {
  computeUnitStatuses,
  isLevelUnlocked,
  newlyUnlockedUnitIds,
  unlockedLevels,
  type UnitProgressLike,
} from './unitUnlock';

function unit(id: string, level: Unit['level'], order: number, itemIds: string[]): Unit {
  return { id, level, order, title: id, titleMi: id, emoji: 'book', itemIds, grammar: id };
}

const units: Unit[] = [
  unit('b01', 'beginner', 1, ['a1', 'a2']),
  unit('b02', 'beginner', 2, ['b1', 'b2']),
  unit('i01', 'intermediate', 1, ['c1', 'c2']),
  unit('i02', 'intermediate', 2, ['d1', 'd2']),
  unit('a01', 'advanced', 1, ['e1']),
];

const done = (unitId: string): UnitProgressLike => ({
  unit_id: unitId,
  learned_at: '2026-10-10T00:00:00Z',
  completed_at: '2026-10-10T00:00:00Z',
  best_score: 11,
  attempts: 1,
});

function statuses(opts: { progress?: UnitProgressLike[]; learned?: string[]; beginnerCompleted?: boolean }) {
  return computeUnitStatuses(units, {
    unitProgress: new Map((opts.progress ?? []).map((p) => [p.unit_id, p])),
    learned: new Set(opts.learned ?? []),
    beginnerCompleted: opts.beginnerCompleted ?? false,
  });
}

const stateOf = (map: ReturnType<typeof statuses>) => Object.fromEntries([...map].map(([id, s]) => [id, s.state]));

describe('computeUnitStatuses (AC1)', () => {
  it('gives a new learner only Beginner unit 1', () => {
    expect(stateOf(statuses({}))).toEqual({
      b01: 'available',
      b02: 'locked',
      i01: 'locked',
      i02: 'locked',
      a01: 'locked',
    });
  });

  it('unlocks the next unit when the previous unit check is passed (AC3)', () => {
    expect(stateOf(statuses({ progress: [done('b01')] }))).toMatchObject({ b01: 'complete', b02: 'available' });
  });

  it('does not unlock past a unit that was only learned or attempted (AC4)', () => {
    const progress: UnitProgressLike[] = [
      { unit_id: 'b01', learned_at: '2026-10-10T00:00:00Z', completed_at: null, best_score: 9, attempts: 2 },
    ];
    expect(stateOf(statuses({ progress }))).toMatchObject({ b01: 'in_progress', b02: 'locked' });
  });

  it('shows in progress once Learn is done, an attempt was made or an item is learned', () => {
    const learnedOnly: UnitProgressLike = { unit_id: 'b01', learned_at: 'x', completed_at: null, best_score: null, attempts: 0 };
    const attemptedOnly: UnitProgressLike = { unit_id: 'b01', learned_at: null, completed_at: null, best_score: 5, attempts: 1 };
    expect(statuses({ progress: [learnedOnly] }).get('b01')?.state).toBe('in_progress');
    expect(statuses({ progress: [attemptedOnly] }).get('b01')?.state).toBe('in_progress');
    expect(statuses({ learned: ['a1'] }).get('b01')?.state).toBe('in_progress');
  });

  it('opens the first unit of a level only when every unit of the previous level is complete (FR2.3, AC12)', () => {
    expect(stateOf(statuses({ progress: [done('b01')] })).i01).toBe('locked');
    const allBeginner = statuses({ progress: [done('b01'), done('b02')] });
    expect(stateOf(allBeginner)).toMatchObject({ i01: 'available', i02: 'locked', a01: 'locked' });
    const allIntermediate = statuses({ progress: [done('b01'), done('b02'), done('i01'), done('i02')] });
    expect(stateOf(allIntermediate).a01).toBe('available');
  });

  it('reports best score, attempts and item counts', () => {
    const map = statuses({ progress: [{ ...done('b01'), best_score: 12, attempts: 3 }], learned: ['a1', 'b1'] });
    expect(map.get('b01')).toMatchObject({ bestScore: 12, attempts: 3, itemsLearned: 1, itemsTotal: 2, deckDone: true });
    expect(map.get('b02')).toMatchObject({ bestScore: null, itemsLearned: 1, itemsTotal: 2, deckDone: false });
  });
});

describe('PoC migration rule (FR2.4, AC5)', () => {
  it('treats every Beginner unit as complete when beginner_completed_at was set', () => {
    const map = statuses({ beginnerCompleted: true });
    expect(stateOf(map)).toEqual({
      b01: 'complete',
      b02: 'complete',
      i01: 'available',
      i02: 'locked',
      a01: 'locked',
    });
  });

  it('completes a unit whose items were all learned already', () => {
    const map = statuses({ learned: ['a1', 'a2'] });
    expect(stateOf(map)).toMatchObject({ b01: 'complete', b02: 'available' });
  });

  it('keeps a partly learned unit incomplete', () => {
    expect(statuses({ learned: ['a1'] }).get('b01')?.state).toBe('in_progress');
  });

  it('lets already-learned units chain, so earlier learners skip what they know', () => {
    const map = statuses({ learned: ['a1', 'a2', 'b1', 'b2'] });
    expect(stateOf(map)).toMatchObject({ b01: 'complete', b02: 'complete', i01: 'available' });
  });

  it('shows a fully learned unit as complete even if an earlier one is not', () => {
    const map = statuses({ learned: ['b1', 'b2'] });
    expect(stateOf(map)).toMatchObject({ b01: 'available', b02: 'complete' });
  });
});

describe('levels', () => {
  it('unlocks a level when its first unit is not locked', () => {
    expect(unlockedLevels(units, statuses({}))).toEqual(['beginner']);
    expect(unlockedLevels(units, statuses({ beginnerCompleted: true }))).toEqual(['beginner', 'intermediate']);
    expect(isLevelUnlocked('intermediate', units, statuses({}))).toBe(false);
  });

  it('ignores levels without units', () => {
    const onlyBeginner = units.filter((u) => u.level === 'beginner');
    const map = computeUnitStatuses(onlyBeginner, { unitProgress: new Map(), learned: new Set(), beginnerCompleted: false });
    expect(unlockedLevels(onlyBeginner, map)).toEqual(['beginner']);
  });
});

describe('newlyUnlockedUnitIds', () => {
  it('lists units that were locked before and are open now', () => {
    const before = statuses({});
    const after = statuses({ progress: [done('b01')] });
    expect(newlyUnlockedUnitIds(before, after)).toEqual(['b02']);
  });

  it('is empty when nothing changed', () => {
    expect(newlyUnlockedUnitIds(statuses({}), statuses({}))).toEqual([]);
  });
});
