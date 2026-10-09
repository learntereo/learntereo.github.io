import { describe, expect, it } from 'vitest';
import { units } from '../content/content';
import {
  TREASURES,
  TREASURE_COUNT,
  newlyUnlockedTreasureIds,
  treasureAfter,
  treasureSlots,
  unlockedTreasureIds,
} from './treasures';
import type { Unit } from './types';
import { computeUnitStatuses, type UnitProgressLike } from './unitUnlock';

const EM_DASH = String.fromCharCode(0x2014);

function fakeUnits(count: number): Unit[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `u${i + 1}`,
    level: i < 8 ? 'beginner' : i < 16 ? 'intermediate' : 'advanced',
    order: i + 1,
    title: `Unit ${i + 1}`,
    titleMi: `Unit ${i + 1}`,
    emoji: 'x',
    itemIds: [`i${i + 1}`],
    grammar: 'g',
  }));
}

const done = (unitId: string): UnitProgressLike => ({ unit_id: unitId, learned_at: 'x', completed_at: 'x', best_score: 12, attempts: 1 });

function statuses(list: readonly Unit[], completed: string[], beginnerCompleted = false) {
  return computeUnitStatuses(list, {
    unitProgress: new Map(completed.map((id) => [id, done(id)])),
    learned: new Set(),
    beginnerCompleted,
  });
}

describe('treasure definitions', () => {
  it('has 10 treasures in the agreed order with a name and a short friendly caption', () => {
    expect(TREASURE_COUNT).toBe(10);
    expect(TREASURES.map((t) => t.name)).toEqual([
      'Pāua',
      'Jandals',
      'Silver fern',
      'Pōhutukawa',
      'Gumboot',
      'Pavlova',
      'Fish and chips',
      'Hokey pokey ice cream',
      'Tūī',
      'Golden kiwi',
    ]);
    for (const t of TREASURES) {
      expect(t.caption.length).toBeGreaterThan(10);
      expect(t.caption.length).toBeLessThan(110);
      expect(t.caption + t.name).not.toContain(EM_DASH);
    }
    expect(new Set(TREASURES.map((t) => t.id)).size).toBe(10);
  });

  it('places them after units 2, 4, 6, 8, 10, 12, 14, 16, 19 and 22', () => {
    expect(TREASURES.map((t) => t.afterUnit)).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 19, 22]);
  });

  it('follows the right real units: 8 ends Beginner, 16 ends Intermediate, 22 ends the course', () => {
    const slots = treasureSlots(units);
    expect(slots).toHaveLength(10);
    expect(slots[3].unit.id).toBe('b08-whare-kura');
    expect(slots[7].unit.id).toBe('i08-pupuri');
    expect(slots[9].unit.id).toBe(units[units.length - 1].id);
    expect(treasureAfter('b02-whanau', slots)?.treasure.id).toBe('paua');
    expect(treasureAfter('b01-greetings', slots)).toBeUndefined();
  });

  it('leaves out treasures that fall past the end of a short course', () => {
    expect(treasureSlots(fakeUnits(5)).map((s) => s.treasure.id)).toEqual(['paua', 'jandals']);
  });
});

describe('unlocked treasures', () => {
  const list = fakeUnits(22);
  const slots = treasureSlots(list);

  it('starts with nothing unlocked', () => {
    expect(unlockedTreasureIds(slots, statuses(list, [])).size).toBe(0);
  });

  it('unlocks a treasure when the unit before it is complete', () => {
    expect([...unlockedTreasureIds(slots, statuses(list, ['u1']))]).toEqual([]);
    expect([...unlockedTreasureIds(slots, statuses(list, ['u2']))]).toEqual(['paua']);
    expect([...unlockedTreasureIds(slots, statuses(list, ['u1', 'u2', 'u4']))]).toEqual(['paua', 'jandals']);
  });

  it('unlocks treasures for units already complete through the PoC migration rule', () => {
    const migrated = statuses(list, [], true);
    expect([...unlockedTreasureIds(slots, migrated)]).toEqual(['paua', 'jandals', 'silver-fern', 'pohutukawa']);
  });

  it('collects all ten once the whole course is complete', () => {
    expect(unlockedTreasureIds(slots, statuses(list, list.map((u) => u.id))).size).toBe(10);
  });

  it('reports the treasures a pass unlocks, and nothing when nothing new opens', () => {
    const before = statuses(list, ['u1']);
    const after = statuses(list, ['u1', 'u2']);
    expect(newlyUnlockedTreasureIds(slots, before, after)).toEqual(['paua']);
    expect(newlyUnlockedTreasureIds(slots, after, after)).toEqual([]);
    expect(newlyUnlockedTreasureIds(slots, statuses(list, []), statuses(list, ['u1']))).toEqual([]);
  });

  it('reports the golden kiwi when the last unit is completed', () => {
    const almost = list.slice(0, 21).map((u) => u.id);
    expect(newlyUnlockedTreasureIds(slots, statuses(list, almost), statuses(list, [...almost, 'u22']))).toEqual(['golden-kiwi']);
  });
});
