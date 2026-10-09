import { describe, expect, it } from 'vitest';
import {
  EASE_MAX,
  EASE_MIN,
  EASE_START,
  NEW_SRS,
  addDays,
  applySrs,
  backfillDueDates,
  clampEase,
  countDue,
  itemResults,
  nextSrs,
  selectDue,
  type SrsFields,
} from './srs';
import type { Outcome, Result } from './types';

const TODAY = '2026-10-10';

describe('addDays', () => {
  it('moves across month and year ends', () => {
    expect(addDays('2026-10-10', 3)).toBe('2026-10-13');
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('nextSrs (FR7.1)', () => {
  it('first try: interval = round(interval x ease), ease +0.1', () => {
    const next = nextSrs(NEW_SRS, 'first', TODAY);
    expect(next).toEqual({ ease: 2.6, interval_days: 3, due_on: '2026-10-13', lapses: 0 });
    const again = nextSrs(next, 'first', TODAY);
    expect(again.interval_days).toBe(8); // round(3 x 2.6)
    expect(again.ease).toBe(2.7);
  });

  it('retry: interval unchanged, ease -0.15', () => {
    const state: SrsFields = { ease: 2.5, interval_days: 6, due_on: null, lapses: 0 };
    expect(nextSrs(state, 'retry', TODAY)).toEqual({ ease: 2.35, interval_days: 6, due_on: '2026-10-16', lapses: 0 });
  });

  it('missed: interval resets to 1, ease -0.2, one more lapse', () => {
    const state: SrsFields = { ease: 2.5, interval_days: 20, due_on: null, lapses: 1 };
    expect(nextSrs(state, 'missed', TODAY)).toEqual({ ease: 2.3, interval_days: 1, due_on: '2026-10-11', lapses: 2 });
  });

  it('never lets the interval drop below one day', () => {
    expect(nextSrs({ ease: 1.3, interval_days: 1, due_on: null, lapses: 0 }, 'first', TODAY).interval_days).toBe(1);
  });

  it('keeps ease inside 1.3 to 3.0 after many increments', () => {
    let state = NEW_SRS;
    for (let i = 0; i < 50; i++) {
      state = nextSrs(state, 'first', TODAY);
      expect(state.ease).toBeLessThanOrEqual(EASE_MAX);
      expect(state.ease).toBeGreaterThanOrEqual(EASE_MIN);
    }
    expect(state.ease).toBe(EASE_MAX);
    expect(state.interval_days).toBe(365);
  });

  it('keeps ease inside 1.3 to 3.0 after many decrements', () => {
    let state: SrsFields = { ...NEW_SRS };
    for (let i = 0; i < 50; i++) {
      state = nextSrs(state, i % 2 === 0 ? 'missed' : 'retry', TODAY);
      expect(state.ease).toBeGreaterThanOrEqual(EASE_MIN);
      expect(state.ease).toBeLessThanOrEqual(EASE_MAX);
    }
    expect(state.ease).toBe(EASE_MIN);
    expect(state.lapses).toBe(25);
  });

  it('never produces float drift: ease always has at most 2 decimals', () => {
    let state = NEW_SRS;
    const pattern: Result[] = ['first', 'retry', 'first', 'missed', 'first', 'first', 'retry', 'missed', 'first'];
    for (let i = 0; i < 200; i++) {
      state = nextSrs(state, pattern[i % pattern.length], TODAY);
      expect(Number(state.ease.toFixed(2))).toBe(state.ease);
      expect(state.ease).toBeGreaterThanOrEqual(EASE_MIN);
      expect(state.ease).toBeLessThanOrEqual(EASE_MAX);
    }
  });
});

describe('clampEase', () => {
  it('bounds and rounds', () => {
    expect(clampEase(0)).toBe(1.3);
    expect(clampEase(99)).toBe(3);
    expect(clampEase(2.1999999999999997)).toBe(2.2);
    expect(clampEase(EASE_START)).toBe(2.5);
  });
});

const outcome = (result: Result, itemIds: string[], opts: Partial<Outcome> = {}): Outcome => ({
  result,
  requeued: false,
  items: itemIds.map((itemId) => ({ itemId, correct: result !== 'missed' })),
  ...opts,
});

describe('itemResults', () => {
  it('uses the question result for single-item questions', () => {
    const map = itemResults([outcome('first', ['a']), outcome('retry', ['b']), outcome('missed', ['c'])]);
    expect(map.get('a')).toEqual(['first']);
    expect(map.get('b')).toEqual(['retry']);
    expect(map.get('c')).toEqual(['missed']);
  });

  it('uses each word\'s own result on a board (FR7.3)', () => {
    const board: Outcome = {
      result: 'missed',
      requeued: false,
      items: [
        { itemId: 'a', correct: true, result: 'first' },
        { itemId: 'b', correct: true, result: 'retry' },
        { itemId: 'c', correct: false, result: 'missed' },
      ],
    };
    const map = itemResults([board]);
    expect(map.get('a')).toEqual(['first']);
    expect(map.get('b')).toEqual(['retry']);
    expect(map.get('c')).toEqual(['missed']);
  });

  it('ignores re-queued answers', () => {
    const map = itemResults([outcome('missed', ['a']), outcome('first', ['a'], { requeued: true })]);
    expect(map.get('a')).toEqual(['missed']);
  });

  it('keeps several answers about one item in order', () => {
    expect(itemResults([outcome('first', ['a']), outcome('retry', ['a'])]).get('a')).toEqual(['first', 'retry']);
  });
});

describe('applySrs (AC9)', () => {
  const row = (id: string, over: Partial<SrsFields> = {}) => ({ item_id: id, ...NEW_SRS, ...over });

  it('updates ease, interval and due date per item', () => {
    const [a, b] = applySrs([row('a'), row('b')], [outcome('first', ['a']), outcome('missed', ['b'])], TODAY);
    expect(a).toMatchObject({ ease: 2.6, interval_days: 3, due_on: '2026-10-13' });
    expect(b).toMatchObject({ ease: 2.3, interval_days: 1, due_on: '2026-10-11', lapses: 1 });
  });

  it('leaves untouched rows alone', () => {
    const untouched = row('z', { due_on: '2026-11-01' });
    expect(applySrs([untouched], [outcome('first', ['a'])], TODAY)).toEqual([untouched]);
  });
});

describe('selectDue (FR7.2)', () => {
  const row = (id: string, due: string | null, learned = true) => ({
    item_id: id,
    first_correct_at: learned ? '2026-10-01T00:00:00Z' : null,
    ...NEW_SRS,
    due_on: due,
  });

  it('returns learned items due today or earlier, most overdue first', () => {
    const rows = [row('c', '2026-10-10'), row('a', '2026-10-01'), row('b', '2026-10-05'), row('later', '2026-10-11')];
    expect(selectDue(rows, TODAY).map((r) => r.item_id)).toEqual(['a', 'b', 'c']);
  });

  it('skips unlearned, unscheduled and unknown items', () => {
    const rows = [row('u', '2026-10-01', false), row('n', null), row('gone', '2026-10-01'), row('ok', '2026-10-01')];
    expect(selectDue(rows, TODAY, 15, (id) => id !== 'gone').map((r) => r.item_id)).toEqual(['ok']);
  });

  it('caps a round at 15 and counts all due items', () => {
    const rows = Array.from({ length: 40 }, (_, i) => row(`i${String(i).padStart(2, '0')}`, '2026-10-01'));
    expect(selectDue(rows, TODAY)).toHaveLength(15);
    expect(countDue(rows, TODAY)).toBe(40);
  });
});

describe('backfillDueDates (FR7.4)', () => {
  it('makes learned, unscheduled items due today and touches nothing else', () => {
    const base = { ...NEW_SRS };
    const rows = [
      { item_id: 'a', first_correct_at: 'x', ...base, due_on: null },
      { item_id: 'b', first_correct_at: null, ...base, due_on: null },
      { item_id: 'c', first_correct_at: 'x', ...base, due_on: '2026-10-20' },
    ];
    const changed = backfillDueDates(rows, TODAY);
    expect(changed.map((r) => r.item_id)).toEqual(['a']);
    expect(changed[0].due_on).toBe(TODAY);
  });
});
