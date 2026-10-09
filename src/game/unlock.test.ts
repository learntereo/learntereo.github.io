import { describe, expect, it } from 'vitest';
import { makeItems } from './__fixtures__/items';
import { isBeginnerComplete, learnedIds, levelProgress } from './unlock';

const items = makeItems();
const beginnerIds = items.filter((i) => i.level === 'beginner').map((i) => i.id);

describe('learnedIds', () => {
  it('includes only rows with first_correct_at set', () => {
    const ids = learnedIds([
      { item_id: 'a', first_correct_at: '2026-10-09T00:00:00Z' },
      { item_id: 'b', first_correct_at: null },
    ]);
    expect([...ids]).toEqual(['a']);
  });
});

describe('levelProgress', () => {
  it('counts learned items in the level', () => {
    const learned = new Set(beginnerIds.slice(0, 7));
    expect(levelProgress(items, 'beginner', learned)).toEqual({ learned: 7, total: 30 });
    expect(levelProgress(items, 'intermediate', learned)).toEqual({ learned: 0, total: 30 });
  });
});

describe('isBeginnerComplete', () => {
  it('is false when nothing or some items are learned', () => {
    expect(isBeginnerComplete(items, new Set())).toBe(false);
    expect(isBeginnerComplete(items, new Set(beginnerIds.slice(0, -1)))).toBe(false);
  });

  it('is false when only intermediate items are learned', () => {
    const intermediate = items.filter((i) => i.level === 'intermediate').map((i) => i.id);
    expect(isBeginnerComplete(items, new Set(intermediate))).toBe(false);
  });

  it('is true when every beginner item is learned (AC18)', () => {
    expect(isBeginnerComplete(items, new Set(beginnerIds))).toBe(true);
  });

  it('is false when there are no beginner items at all', () => {
    expect(isBeginnerComplete([], new Set())).toBe(false);
  });
});
