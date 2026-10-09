import { describe, expect, it } from 'vitest';
import { makeItems } from './__fixtures__/items';
import { allItems } from '../content/content';
import { createRng } from './rng';
import { createRound, validateRoundState, serialiseRound } from './roundState';
import { generateReview } from './reviewRound';
import type { Item } from './types';

const items = makeItems();
const byId = new Map<string, Item>(items.map((i) => [i.id, i]));
const words = items.filter((i) => i.kind === 'word' && i.level === 'beginner');
const sentences = items.filter((i) => i.kind === 'sentence' && i.level === 'beginner');

describe('generateReview (AC9)', () => {
  it('asks one question per due item when fewer than five words are due', () => {
    const due = [words[0], words[1], sentences[0], sentences[1]];
    const qs = generateReview(due, items, createRng(1));
    expect(qs).toHaveLength(4);
    expect(qs.flatMap((q) => q.itemIds).sort()).toEqual(due.map((d) => d.id).sort());
    expect(qs.every((q) => !q.requeued)).toBe(true);
  });

  it('turns five or more due words into one Match board and covers every item once', () => {
    const due = [...words.slice(0, 7), sentences[0]];
    const qs = generateReview(due, items, createRng(2));
    const boards = qs.filter((q) => q.mode === 'match');
    expect(boards).toHaveLength(1);
    expect(boards[0].itemIds).toEqual(words.slice(0, 5).map((w) => w.id));
    expect(qs).toHaveLength(1 + 3);
    expect(qs.flatMap((q) => q.itemIds).sort()).toEqual(due.map((d) => d.id).sort());
  });

  it('uses fitting modes: words get translate or write, sentences also order and gap', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      for (const q of generateReview([words[0], sentences[0]], items, createRng(seed))) {
        const item = byId.get(q.itemIds[0])!;
        if (item.kind === 'word') expect(['translate', 'write']).toContain(q.mode);
        else expect(['translate', 'write', 'order', 'gap']).toContain(q.mode);
        seen.add(q.mode);
      }
    }
    expect(seen).toEqual(new Set(['translate', 'write', 'order', 'gap']));
  });

  it('stores decoys for Order and options for Fill the gap', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const q of generateReview([sentences[0], sentences[1], sentences[2]], items, createRng(seed))) {
        if (q.mode === 'order') expect(q.decoys?.length).toBeGreaterThan(0);
        if (q.mode === 'gap') {
          expect(q.options).toContain((byId.get(q.itemIds[0]) as { tiles: string[] }).tiles[q.gapIndex!]);
        }
      }
    }
  });

  it('builds a valid, resumable review round across levels', () => {
    const due = [words[0], items.find((i) => i.level === 'intermediate' && i.kind === 'word')!, sentences[0]];
    const state = createRound('beginner', 'review', generateReview(due, items, createRng(3)));
    expect(validateRoundState(serialiseRound(state), byId)).not.toBeNull();
  });

  it('works with the real content', () => {
    const due = allItems.slice(0, 15);
    const qs = generateReview(due, allItems, createRng(4));
    expect(qs.flatMap((q) => q.itemIds)).toHaveLength(15);
  });
});
