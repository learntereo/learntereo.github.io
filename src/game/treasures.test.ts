import { describe, expect, it } from 'vitest';
import { units } from '../content/content';
import {
  TREASURES,
  TREASURE_COUNT,
  newlyUnlockedTreasureIds,
  nextRank,
  nextTreasure,
  nextTreasureProgress,
  rankFor,
  rankUp,
  recentTreasures,
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
  it('has 20 treasures in the agreed order with a name and a short friendly caption', () => {
    expect(TREASURE_COUNT).toBe(20);
    expect(TREASURES.map((t) => t.name)).toEqual([
      'Pāua', 'Jandals', 'Silver fern', 'Pōhutukawa', 'Gumboot', 'Pavlova', 'Fish and chips', 'Hokey pokey ice cream', 'Tūī',
      'Pūkeko', 'Kūmara', 'Kōwhai', 'Wētā', 'Tuatara', 'Kererū', 'Pīwakawaka', 'Feijoa', 'Chilly bin', 'Number 8 wire',
      'Golden kiwi',
    ]);
    for (const t of TREASURES) {
      expect(t.caption.length).toBeGreaterThan(10);
      expect(t.caption.length).toBeLessThan(120);
      expect(t.caption + t.name).not.toContain(EM_DASH);
    }
    expect(new Set(TREASURES.map((t) => t.id)).size).toBe(20);
    expect(TREASURES[2].caption).toContain('silver and catch the moonlight');
  });

  it('puts treasure N after unit N for 1 to 19, and the Golden kiwi after the final unit', () => {
    expect(TREASURES.map((t) => t.afterUnit)).toEqual([...Array.from({ length: 19 }, (_, i) => i + 1), 22]);
  });

  it('follows the right real units, so the first treasure comes after unit 1', () => {
    const slots = treasureSlots(units);
    expect(slots).toHaveLength(20);
    expect(slots[0].unit.id).toBe('b01-greetings');
    expect(slots[7].unit.id).toBe('b08-whare-kura');
    expect(slots[18].unit.id).toBe(units[18].id);
    expect(slots[19].unit.id).toBe(units[units.length - 1].id);
    expect(treasureAfter('b01-greetings', slots)?.treasure.id).toBe('paua');
    expect(treasureAfter(units[19].id, slots)).toBeUndefined();
  });

  it('leaves out treasures that fall past the end of a short course', () => {
    expect(treasureSlots(fakeUnits(2)).map((s) => s.treasure.id)).toEqual(['paua', 'jandals']);
  });
});

describe('unlocked treasures', () => {
  const list = fakeUnits(22);
  const slots = treasureSlots(list);

  it('starts with nothing unlocked', () => {
    expect(unlockedTreasureIds(slots, statuses(list, [])).size).toBe(0);
  });

  it('unlocks the first treasure when unit 1 is complete', () => {
    expect([...unlockedTreasureIds(slots, statuses(list, ['u1']))]).toEqual(['paua']);
    expect([...unlockedTreasureIds(slots, statuses(list, ['u1', 'u3']))]).toEqual(['paua', 'silver-fern']);
  });

  it('unlocks treasures for units already complete through the PoC migration rule', () => {
    const migrated = statuses(list, [], true);
    expect(unlockedTreasureIds(slots, migrated).size).toBe(8);
  });

  it('keeps the Golden kiwi for the last unit only', () => {
    const almost = list.slice(0, 21).map((u) => u.id);
    expect(unlockedTreasureIds(slots, statuses(list, almost)).has('golden-kiwi')).toBe(false);
    expect(unlockedTreasureIds(slots, statuses(list, list.map((u) => u.id))).size).toBe(20);
  });

  it('reports the treasures a pass unlocks, and nothing when nothing new opens', () => {
    const before = statuses(list, []);
    const after = statuses(list, ['u1']);
    expect(newlyUnlockedTreasureIds(slots, before, after)).toEqual(['paua']);
    expect(newlyUnlockedTreasureIds(slots, after, after)).toEqual([]);
  });

  it('reports the golden kiwi when the last unit is completed', () => {
    const almost = list.slice(0, 21).map((u) => u.id);
    expect(newlyUnlockedTreasureIds(slots, statuses(list, almost), statuses(list, [...almost, 'u22']))).toEqual(['golden-kiwi']);
  });
});

describe('nextTreasure', () => {
  const list = fakeUnits(22);
  const slots = treasureSlots(list);

  it('is the first treasure for a new learner', () => {
    expect(nextTreasure(slots, statuses(list, []))?.treasure.id).toBe('paua');
  });

  it('is the first locked one in collection order', () => {
    expect(nextTreasure(slots, statuses(list, ['u1', 'u3']))?.treasure.id).toBe('jandals');
    expect(nextTreasure(slots, statuses(list, ['u1', 'u2', 'u3']))?.treasure.id).toBe('pohutukawa');
  });

  it('is undefined when everything is collected', () => {
    expect(nextTreasure(slots, statuses(list, list.map((u) => u.id)))).toBeUndefined();
  });
});

describe('treasure stories', () => {
  it('has a story of two to four short sentences for each of the 20 treasures', () => {
    for (const t of TREASURES) {
      const sentences = t.story.split(/(?<=[.!?])\s+/);
      expect(sentences.length, t.id).toBeGreaterThanOrEqual(2);
      expect(sentences.length, t.id).toBeLessThanOrEqual(4);
      expect(t.story.length, t.id).toBeLessThan(420);
    }
  });

  it('says New Zealand in English text, never Aotearoa, and has no em dashes', () => {
    for (const t of TREASURES) {
      const all = t.name + t.caption + t.story;
      expect(all, t.id).not.toMatch(/Aotearoa/);
      expect(all, t.id).not.toContain(EM_DASH);
    }
  });

  it('phrases disputed origins carefully', () => {
    const story = (id: string) => TREASURES.find((t) => t.id === id)!.story;
    expect(story('pavlova')).toContain('Both countries claim');
    expect(story('jandals')).toContain('often said');
    expect(story('silver-fern')).toContain('often said');
  });
});

describe('collector rank', () => {
  it('follows the agreed thresholds', () => {
    const name = (n: number) => rankFor(n).name;
    expect([0, 1, 4, 5, 9, 10, 14, 15, 19, 20].map(name)).toEqual([
      'Ready to start',
      'Kiwiana rookie',
      'Kiwiana rookie',
      'Explorer',
      'Explorer',
      'Collector',
      'Collector',
      'Treasure hunter',
      'Treasure hunter',
      'Kiwiana legend',
    ]);
  });

  it('says what the next rank is and how many more treasures it needs', () => {
    expect(nextRank(0)).toMatchObject({ rank: { name: 'Kiwiana rookie' }, needed: 1 });
    expect(nextRank(3)).toMatchObject({ rank: { name: 'Explorer' }, needed: 2 });
    expect(nextRank(19)).toMatchObject({ rank: { name: 'Kiwiana legend' }, needed: 1 });
    expect(nextRank(20)).toBeUndefined();
  });

  it('reports a rank-up only when a threshold is crossed', () => {
    expect(rankUp(0, 1)?.name).toBe('Kiwiana rookie');
    expect(rankUp(4, 5)?.name).toBe('Explorer');
    expect(rankUp(5, 6)).toBeUndefined();
    expect(rankUp(19, 20)?.name).toBe('Kiwiana legend');
    expect(rankUp(3, 3)).toBeUndefined();
  });
});

describe('next treasure progress', () => {
  const list = fakeUnits(22);

  it('uses the learned items of the unit before the next treasure', () => {
    const two = list.map((u) => ({ ...u, itemIds: [`${u.id}a`, `${u.id}b`] }));
    const map = computeUnitStatuses(two, {
      unitProgress: new Map([['u1', done('u1')]]),
      learned: new Set(['u2a']),
      beginnerCompleted: false,
    });
    const progress = nextTreasureProgress(treasureSlots(two), map);
    expect(progress?.slot.treasure.id).toBe('jandals');
    expect(progress).toMatchObject({ learned: 1, total: 2, ready: false });
  });

  it('is ready when every item of the unit is learned but the Kiwiz is not passed', () => {
    const two = list.map((u) => ({ ...u, itemIds: [`${u.id}a`, `${u.id}b`] }));
    // A unit whose items are all learned counts as complete, so ready only shows for a deck with an unlearned sentence.
    const map = computeUnitStatuses(two, {
      unitProgress: new Map([['u1', done('u1')]]),
      learned: new Set(['u2a', 'u2b']),
      beginnerCompleted: false,
    });
    expect(nextTreasureProgress(treasureSlots(two), map)?.slot.treasure.id).toBe('silver-fern');
  });

  it('is not ready while items are still to learn, and is undefined once everything is collected', () => {
    const two = list.map((u) => ({ ...u, itemIds: [`${u.id}a`, `${u.id}b`] }));
    const twoSlots = treasureSlots(two);
    const map = computeUnitStatuses(two, { unitProgress: new Map(), learned: new Set(['u1a']), beginnerCompleted: false });
    expect(nextTreasureProgress(twoSlots, map)).toMatchObject({ learned: 1, total: 2, ready: false });
    const all = computeUnitStatuses(two, {
      unitProgress: new Map(two.map((u) => [u.id, done(u.id)])),
      learned: new Set(),
      beginnerCompleted: false,
    });
    expect(nextTreasureProgress(twoSlots, all)).toBeUndefined();
  });
});

describe('recently unlocked', () => {
  const list = fakeUnits(22);
  const slots = treasureSlots(list);

  it('lists the last three unlocked, newest first, with their dates', () => {
    const map = statuses(list, ['u1', 'u2', 'u3', 'u4']);
    const dates = new Map([
      ['u1', '2026-10-01T00:00:00Z'],
      ['u2', '2026-10-02T00:00:00Z'],
      ['u3', '2026-10-04T00:00:00Z'],
      ['u4', '2026-10-03T00:00:00Z'],
    ]);
    const recent = recentTreasures(slots, map, dates);
    expect(recent.map((r) => r.slot.treasure.id)).toEqual(['silver-fern', 'pohutukawa', 'jandals']);
    expect(recent[0].date).toBe('2026-10-04T00:00:00Z');
  });

  it('puts treasures without a completion date after dated ones', () => {
    const map = statuses(list, [], true);
    const recent = recentTreasures(slots, map, new Map([['u2', '2026-10-02T00:00:00Z']]));
    expect(recent.map((r) => r.slot.treasure.id)).toEqual(['jandals', 'hokey-pokey', 'fish-and-chips']);
    expect(recent[1].date).toBeNull();
  });

  it('is empty when nothing is unlocked', () => {
    expect(recentTreasures(slots, statuses(list, []), new Map())).toEqual([]);
  });
});
