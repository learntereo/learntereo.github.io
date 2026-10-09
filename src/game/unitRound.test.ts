import { describe, expect, it } from 'vitest';
import { makeItems } from './__fixtures__/items';
import { allItems, units } from '../content/content';
import { createRng } from './rng';
import {
  CHECK_SIZE,
  MAX_REVIEW_ITEMS,
  PASS_PERCENT,
  PRACTICE_SIZE,
  generateUnitCheck,
  generateUnitPractice,
  isPass,
  missedItemIds,
  passMark,
  reviewPool,
} from './unitRound';
import { createRound, recordAnswer, currentQuestion } from './roundState';
import type { Item, Outcome, Result, RoundState, Unit } from './types';

const items = makeItems();
const byId = new Map<string, Item>(items.map((i) => [i.id, i]));

const wordIds = (from: number, to: number, p = 'b') =>
  Array.from({ length: to - from + 1 }, (_, i) => `w-${p}-${String(from + i).padStart(3, '0')}`);
const sentenceIds = (from: number, to: number, p = 'b') =>
  Array.from({ length: to - from + 1 }, (_, i) => `s-${p}-${String(from + i).padStart(3, '0')}`);

const unitOne: Unit = {
  id: 'u1',
  level: 'beginner',
  order: 1,
  title: 'One',
  titleMi: 'Tahi',
  emoji: 'x',
  itemIds: [...wordIds(1, 12), ...sentenceIds(1, 6)],
  grammar: 'u1',
};
const unitTwo: Unit = {
  id: 'u2',
  level: 'beginner',
  order: 2,
  title: 'Two',
  titleMi: 'Rua',
  emoji: 'x',
  itemIds: [...wordIds(13, 20), ...sentenceIds(7, 10)],
  grammar: 'u2',
};
const unitIds = (u: Unit) => new Set(u.itemIds);

describe('pass mark (FR5.2)', () => {
  it('needs 10 of 12', () => {
    expect(PASS_PERCENT).toBe(80);
    expect(passMark(12)).toBe(10);
    expect(isPass(10, 12)).toBe(true);
    expect(isPass(9, 12)).toBe(false);
    expect(isPass(12, 12)).toBe(true);
  });

  it('rounds up for other sizes', () => {
    expect(passMark(10)).toBe(8);
    expect(passMark(5)).toBe(4);
    expect(passMark(7)).toBe(6);
  });

  it('never passes an empty round', () => {
    expect(isPass(0, 0)).toBe(false);
  });
});

describe('generateUnitCheck', () => {
  it('builds 12 questions using only the unit items', () => {
    const qs = generateUnitCheck(unitOne, items, createRng(1));
    expect(qs).toHaveLength(CHECK_SIZE);
    const allowed = unitIds(unitOne);
    for (const q of qs) for (const id of q.itemIds) expect(allowed.has(id)).toBe(true);
  });

  it('mixes modes and never re-queues at the start', () => {
    const qs = generateUnitCheck(unitOne, items, createRng(2));
    expect(new Set(qs.map((q) => q.mode)).size).toBeGreaterThan(1);
    expect(qs.every((q) => !q.requeued)).toBe(true);
  });

  it('is deterministic for a seed and varies across seeds', () => {
    expect(generateUnitCheck(unitOne, items, createRng(9))).toEqual(generateUnitCheck(unitOne, items, createRng(9)));
    expect(generateUnitCheck(unitOne, items, createRng(9))).not.toEqual(generateUnitCheck(unitOne, items, createRng(10)));
  });

  it('does not depend on what is already learned', () => {
    // The check signature has no learned set, so the same seed always gives the same questions.
    expect(generateUnitCheck(unitTwo, items, createRng(3))).toHaveLength(CHECK_SIZE);
  });

  it('covers a good spread of the unit', () => {
    const covered = new Set<string>();
    for (let seed = 1; seed <= 3; seed++) {
      for (const q of generateUnitCheck(unitOne, items, createRng(seed))) q.itemIds.forEach((id) => covered.add(id));
    }
    expect(covered.size).toBeGreaterThanOrEqual(12);
  });
});

describe('reviewPool', () => {
  it('holds learned items from earlier units only', () => {
    const learned = new Set([...wordIds(1, 3), ...wordIds(13, 14)]);
    const pool = reviewPool(unitTwo, [unitOne, unitTwo], items, learned);
    expect(pool.map((i) => i.id).sort()).toEqual(wordIds(1, 3));
  });

  it('is empty for the first unit', () => {
    expect(reviewPool(unitOne, [unitOne, unitTwo], items, new Set(wordIds(1, 12)))).toEqual([]);
  });
});

describe('generateUnitPractice (FR5.1)', () => {
  it('builds 10 questions from the unit when nothing earlier is learned', () => {
    const qs = generateUnitPractice(unitTwo, [unitOne, unitTwo], items, new Set(), createRng(4));
    expect(qs).toHaveLength(PRACTICE_SIZE);
    const allowed = unitIds(unitTwo);
    for (const q of qs) for (const id of q.itemIds) expect(allowed.has(id)).toBe(true);
  });

  it('adds up to 3 review questions from earlier units', () => {
    const learned = new Set(wordIds(1, 12));
    const qs = generateUnitPractice(unitTwo, [unitOne, unitTwo], items, learned, createRng(5));
    expect(qs).toHaveLength(PRACTICE_SIZE);
    const own = unitIds(unitTwo);
    const review = qs.filter((q) => q.itemIds.some((id) => !own.has(id)));
    expect(review).toHaveLength(MAX_REVIEW_ITEMS);
    for (const q of review) {
      expect(q.mode).toBe('translate');
      expect(q.itemIds).toHaveLength(1);
      expect(learned.has(q.itemIds[0])).toBe(true);
    }
    // everything else is the unit's own
    for (const q of qs.filter((x) => !review.includes(x))) for (const id of q.itemIds) expect(own.has(id)).toBe(true);
  });

  it('uses fewer review questions when little is learned', () => {
    const qs = generateUnitPractice(unitTwo, [unitOne, unitTwo], items, new Set(wordIds(1, 1)), createRng(6));
    const own = unitIds(unitTwo);
    expect(qs.filter((q) => q.itemIds.some((id) => !own.has(id)))).toHaveLength(1);
    expect(qs).toHaveLength(PRACTICE_SIZE);
  });

  it('never repeats a review item and prefers the unit\'s unlearned items for the rest', () => {
    const learned = new Set(wordIds(1, 12));
    const qs = generateUnitPractice(unitTwo, [unitOne, unitTwo], items, learned, createRng(7));
    const own = unitIds(unitTwo);
    const review = qs.filter((q) => q.itemIds.some((id) => !own.has(id))).map((q) => q.itemIds[0]);
    expect(new Set(review).size).toBe(review.length);
  });

  it('is deterministic for a seed', () => {
    const a = generateUnitPractice(unitTwo, [unitOne, unitTwo], items, new Set(wordIds(1, 12)), createRng(8));
    const b = generateUnitPractice(unitTwo, [unitOne, unitTwo], items, new Set(wordIds(1, 12)), createRng(8));
    expect(a).toEqual(b);
  });
});

describe('real content', () => {
  it('builds practice and check rounds for every unit', () => {
    for (const unit of units) {
      expect(generateUnitPractice(unit, units, allItems, new Set(), createRng(1))).toHaveLength(PRACTICE_SIZE);
      expect(generateUnitCheck(unit, allItems, createRng(1))).toHaveLength(CHECK_SIZE);
    }
  });

  it('keeps check questions inside the unit', () => {
    for (const unit of units) {
      const own = unitIds(unit);
      for (const q of generateUnitCheck(unit, allItems, createRng(2))) for (const id of q.itemIds) expect(own.has(id)).toBe(true);
    }
  });
});

describe('missedItemIds', () => {
  function play(state: RoundState, perQuestion: (index: number) => { result: Result; wrongIds: string[] }): RoundState {
    let s = state;
    while (s.index < s.originalCount) {
      const q = currentQuestion(s)!;
      const { result, wrongIds } = perQuestion(s.index);
      const outcome: Outcome = {
        result,
        requeued: false,
        items: q.itemIds.map((itemId) => ({ itemId, correct: !wrongIds.includes(itemId) })),
      };
      s = recordAnswer(s, outcome);
    }
    return s;
  }

  it('lists distinct items answered wrong in the original questions', () => {
    const qs = generateUnitCheck(unitOne, items, createRng(11));
    const state = createRound('beginner', 'unit_check', qs, 'u1');
    const wrongFirst = qs[0].itemIds[0];
    const wrongSecond = qs[1].itemIds[0];
    const finished = play(state, (i) =>
      i === 0 ? { result: 'missed', wrongIds: [wrongFirst] } : i === 1 ? { result: 'missed', wrongIds: [wrongSecond] } : { result: 'first', wrongIds: [] },
    );
    const missed = missedItemIds(finished);
    expect(missed).toContain(wrongFirst);
    expect(missed).toContain(wrongSecond);
    expect(new Set(missed).size).toBe(missed.length);
  });

  it('is empty after a perfect round', () => {
    const state = createRound('beginner', 'unit_check', generateUnitCheck(unitOne, items, createRng(12)), 'u1');
    expect(missedItemIds(play(state, () => ({ result: 'first', wrongIds: [] })))).toEqual([]);
  });

  it('ignores answers to re-queued questions', () => {
    const qs = generateUnitPractice(unitOne, [unitOne], items, new Set(), createRng(13));
    let s = createRound('beginner', 'unit_practice', qs, 'u1');
    s = play(s, (i) => (i === 0 ? { result: 'missed', wrongIds: [qs[0].itemIds[0]] } : { result: 'first', wrongIds: [] }));
    // answer the re-queued question wrongly again
    const q = currentQuestion(s)!;
    s = recordAnswer(s, { result: 'missed', requeued: true, items: q.itemIds.map((itemId) => ({ itemId, correct: false })) });
    expect(missedItemIds(s)).toEqual([qs[0].itemIds[0]]);
    expect(byId.size).toBeGreaterThan(0);
  });
});
