import { describe, expect, it } from 'vitest';
import type { Unit } from './types';
import {
  OPEN_WINDOW,
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
  unit('b03', 'beginner', 3, ['c1']),
  unit('b04', 'beginner', 4, ['d1']),
  unit('i01', 'intermediate', 1, ['e1', 'e2']),
  unit('i02', 'intermediate', 2, ['f1', 'f2']),
  unit('a01', 'advanced', 1, ['g1']),
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

describe('unlock window', () => {
  it('opens the first three units for a new learner', () => {
    expect(OPEN_WINDOW).toBe(3);
    expect(stateOf(statuses({}))).toEqual({
      b01: 'available',
      b02: 'available',
      b03: 'available',
      b04: 'locked',
      i01: 'locked',
      i02: 'locked',
      a01: 'locked',
    });
  });

  it('opens one more unit for each unit completed, so three stay open', () => {
    expect(stateOf(statuses({ progress: [done('b01')] }))).toMatchObject({
      b01: 'complete',
      b02: 'available',
      b03: 'available',
      b04: 'available',
      i01: 'locked',
    });
    expect(stateOf(statuses({ progress: [done('b01'), done('b02')] }))).toMatchObject({
      b03: 'available',
      b04: 'available',
      i01: 'available',
      i02: 'locked',
    });
  });

  it('keeps completed units open and lets a later unit be completed first', () => {
    const map = stateOf(statuses({ progress: [done('b03')] }));
    expect(map).toMatchObject({ b01: 'available', b02: 'available', b03: 'complete', b04: 'available', i01: 'locked' });
  });

  it('crosses level boundaries and replaces the old whole-level rule', () => {
    const map = stateOf(statuses({ progress: [done('b01'), done('b02'), done('b03')] }));
    expect(map).toMatchObject({ b04: 'available', i01: 'available', i02: 'available', a01: 'locked' });
  });

  it('shrinks the window at the end of the course', () => {
    const all = ['b01', 'b02', 'b03', 'b04', 'i01', 'i02'].map(done);
    expect(stateOf(statuses({ progress: all })).a01).toBe('available');
    const every = stateOf(statuses({ progress: [...all, done('a01')] }));
    expect(Object.values(every).every((s) => s === 'complete')).toBe(true);
  });

  it('does not open more units for a unit that was only learned or attempted', () => {
    const progress: UnitProgressLike[] = [
      { unit_id: 'b01', learned_at: '2026-10-10T00:00:00Z', completed_at: null, best_score: 9, attempts: 2 },
    ];
    expect(stateOf(statuses({ progress }))).toMatchObject({ b01: 'in_progress', b03: 'available', b04: 'locked' });
  });

  it('shows in progress once Learn is done, an attempt was made or an item is learned', () => {
    const learnedOnly: UnitProgressLike = { unit_id: 'b01', learned_at: 'x', completed_at: null, best_score: null, attempts: 0 };
    const attemptedOnly: UnitProgressLike = { unit_id: 'b01', learned_at: null, completed_at: null, best_score: 5, attempts: 1 };
    expect(statuses({ progress: [learnedOnly] }).get('b01')?.state).toBe('in_progress');
    expect(statuses({ progress: [attemptedOnly] }).get('b01')?.state).toBe('in_progress');
    expect(statuses({ learned: ['a1'] }).get('b01')?.state).toBe('in_progress');
  });

  it('reports best score, attempts and item counts', () => {
    const map = statuses({ progress: [{ ...done('b01'), best_score: 12, attempts: 3 }], learned: ['a1', 'b1'] });
    expect(map.get('b01')).toMatchObject({ bestScore: 12, attempts: 3, itemsLearned: 1, itemsTotal: 2, deckDone: true });
    expect(map.get('b02')).toMatchObject({ bestScore: null, itemsLearned: 1, itemsTotal: 2, deckDone: false });
  });
});

describe('PoC migration rule', () => {
  it('treats every Beginner unit as complete when beginner_completed_at was set', () => {
    expect(stateOf(statuses({ beginnerCompleted: true }))).toEqual({
      b01: 'complete',
      b02: 'complete',
      b03: 'complete',
      b04: 'complete',
      i01: 'available',
      i02: 'available',
      a01: 'available',
    });
  });

  it('completes a unit whose items were all learned already', () => {
    const map = statuses({ learned: ['a1', 'a2'] });
    expect(stateOf(map)).toMatchObject({ b01: 'complete', b02: 'available', b03: 'available', b04: 'available' });
  });

  it('keeps a partly learned unit incomplete', () => {
    expect(statuses({ learned: ['a1'] }).get('b01')?.state).toBe('in_progress');
  });

  it('lets already-learned units chain, so earlier learners skip what they know', () => {
    const map = statuses({ learned: ['a1', 'a2', 'b1', 'b2', 'c1', 'd1'] });
    expect(stateOf(map)).toMatchObject({ b04: 'complete', i01: 'available', i02: 'available', a01: 'available' });
  });
});

describe('levels', () => {
  it('opens Free Practice for a level when any of its units is available or complete', () => {
    expect(unlockedLevels(units, statuses({}))).toEqual(['beginner']);
    expect(isLevelUnlocked('intermediate', units, statuses({}))).toBe(false);
    const two = statuses({ progress: [done('b01'), done('b02')] });
    expect(unlockedLevels(units, two)).toEqual(['beginner', 'intermediate']);
    expect(unlockedLevels(units, statuses({ beginnerCompleted: true }))).toEqual(['beginner', 'intermediate', 'advanced']);
  });

  it('keeps a level open once one of its units is complete', () => {
    const map = statuses({ progress: [done('i02')] });
    expect(isLevelUnlocked('intermediate', units, map)).toBe(true);
  });

  it('ignores levels without units', () => {
    const onlyBeginner = units.filter((u) => u.level === 'beginner');
    const map = computeUnitStatuses(onlyBeginner, { unitProgress: new Map(), learned: new Set(), beginnerCompleted: false });
    expect(unlockedLevels(onlyBeginner, map)).toEqual(['beginner']);
  });
});

describe('newlyUnlockedUnitIds', () => {
  it('lists the one unit that a completion opens', () => {
    expect(newlyUnlockedUnitIds(statuses({}), statuses({ progress: [done('b01')] }))).toEqual(['b04']);
  });

  it('is empty when nothing changed', () => {
    expect(newlyUnlockedUnitIds(statuses({}), statuses({}))).toEqual([]);
  });
});
