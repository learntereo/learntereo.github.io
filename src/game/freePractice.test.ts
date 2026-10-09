import { describe, expect, it } from 'vitest';
import { makeItems } from './__fixtures__/items';
import { availableModes, openItems } from './freePractice';
import type { Unit } from './types';
import { computeUnitStatuses } from './unitUnlock';

const items = makeItems();
const unit = (id: string, level: Unit['level'], order: number, ids: string[]): Unit => ({
  id,
  level,
  order,
  title: id,
  titleMi: id,
  emoji: 'x',
  itemIds: ids,
  grammar: id,
});
const units = [
  unit('u1', 'beginner', 1, ['w-b-001', 'w-b-002', 's-b-001']),
  unit('u2', 'beginner', 2, ['w-b-003', 's-b-002']),
];
const statusesFor = (learned: string[]) =>
  computeUnitStatuses(units, { unitProgress: new Map(), learned: new Set(learned), beginnerCompleted: false });

describe('openItems', () => {
  it('keeps only items from units that are not locked', () => {
    expect(openItems(items, units, statusesFor([])).map((i) => i.id)).toEqual(['w-b-001', 'w-b-002', 's-b-001']);
  });

  it('adds a unit once it opens', () => {
    const open = openItems(items, units, statusesFor(['w-b-001', 'w-b-002', 's-b-001'])).map((i) => i.id);
    expect(open).toContain('w-b-003');
    expect(open).toContain('s-b-002');
  });
});

describe('availableModes', () => {
  it('lists only games with enough content, plus mixed', () => {
    expect(availableModes(items.filter((i) => i.level === 'beginner'), 'beginner')).toEqual([
      'match',
      'translate',
      'write',
      'gap',
      'order',
      'picture',
      'mixed',
    ]);
  });

  it('drops match and picture when the open words are few', () => {
    const few = openItems(items, units, statusesFor([]));
    expect(availableModes(few, 'beginner')).toEqual(['translate', 'write', 'gap', 'order', 'mixed']);
  });

  it('is empty when nothing is open', () => {
    expect(availableModes([], 'beginner')).toEqual([]);
  });
});
