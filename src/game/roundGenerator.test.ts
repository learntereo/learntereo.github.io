import { describe, expect, it } from 'vitest';
import { makeItems } from './__fixtures__/items';
import { allItems } from '../content/content';
import { eligibleModes, generateRound, ROUND_SIZE } from './roundGenerator';
import { createRng } from './rng';
import type { Item, Mode, Question } from './types';

const items = makeItems();
const byId = new Map<string, Item>(items.map((i) => [i.id, i]));
const learnedOf = (ids: string[]) => new Set(ids);
const primaryIds = (qs: Question[]) => qs.map((q) => q.itemIds[0]);

describe('generateRound basics', () => {
  it('returns 10 questions', () => {
    for (const mode of ['match', 'translate', 'order', 'picture', 'mixed'] as Mode[]) {
      expect(generateRound(items, 'beginner', mode, new Set(), createRng(1))).toHaveLength(ROUND_SIZE);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generateRound(items, 'beginner', 'mixed', new Set(), createRng(42));
    const b = generateRound(items, 'beginner', 'mixed', new Set(), createRng(42));
    expect(a).toEqual(b);
  });

  it('differs for different seeds', () => {
    const a = generateRound(items, 'beginner', 'translate', new Set(), createRng(1));
    const b = generateRound(items, 'beginner', 'translate', new Set(), createRng(2));
    expect(a).not.toEqual(b);
  });

  it('only uses items of the requested level', () => {
    const qs = generateRound(items, 'intermediate', 'mixed', new Set(), createRng(3));
    for (const q of qs) for (const id of q.itemIds) expect(byId.get(id)?.level).toBe('intermediate');
  });

  it('marks nothing as re-queued', () => {
    const qs = generateRound(items, 'beginner', 'mixed', new Set(), createRng(3));
    expect(qs.every((q) => q.requeued === false)).toBe(true);
  });

  it('throws when a mode has too little content', () => {
    const few = items.filter((i) => i.kind === 'sentence');
    expect(() => generateRound(few, 'beginner', 'match', new Set(), createRng(1))).toThrow();
  });
});

describe('mode shapes', () => {
  it('Match boards hold 5 distinct words (AC5)', () => {
    for (const q of generateRound(items, 'beginner', 'match', new Set(), createRng(5))) {
      expect(q.mode).toBe('match');
      expect(q.itemIds).toHaveLength(5);
      expect(new Set(q.itemIds).size).toBe(5);
      for (const id of q.itemIds) expect(byId.get(id)?.kind).toBe('word');
    }
  });

  it('Picture boards hold 4 distinct image words (AC12)', () => {
    for (const q of generateRound(items, 'beginner', 'picture', new Set(), createRng(5))) {
      expect(q.mode).toBe('picture');
      expect(q.itemIds).toHaveLength(4);
      expect(new Set(q.itemIds).size).toBe(4);
      for (const id of q.itemIds) {
        const item = byId.get(id);
        expect(item?.kind === 'word' && item.image !== undefined).toBe(true);
      }
    }
  });

  it('Order uses only sentences, with decoys not among the tiles (AC10)', () => {
    for (const level of ['beginner', 'intermediate'] as const) {
      for (const q of generateRound(items, level, 'order', new Set(), createRng(9))) {
        const item = byId.get(q.itemIds[0]);
        expect(item?.kind).toBe('sentence');
        if (item?.kind !== 'sentence') continue;
        expect(q.decoys).toHaveLength(level === 'beginner' ? 1 : 2);
        for (const d of q.decoys ?? []) expect(item.tiles).not.toContain(d);
      }
    }
  });

  it('Translate uses single words and sentences', () => {
    const qs = generateRound(items, 'beginner', 'translate', new Set(), createRng(11));
    for (const q of qs) expect(q.itemIds).toHaveLength(1);
  });
});

describe('no repeats', () => {
  it('does not repeat items in single-item modes', () => {
    for (const mode of ['translate', 'order'] as Mode[]) {
      for (let seed = 0; seed < 25; seed++) {
        const ids = generateRound(items, 'beginner', mode, new Set(), createRng(seed)).flatMap((q) => q.itemIds);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('does not repeat a primary item in any mode', () => {
    for (const mode of ['match', 'picture', 'mixed'] as Mode[]) {
      for (let seed = 0; seed < 25; seed++) {
        const ids = primaryIds(generateRound(items, 'beginner', mode, new Set(), createRng(seed)));
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('reuses words across boards only when the level is too small for 10 distinct boards', () => {
    // 20 fixture words < 10 boards x 5 words, so reuse is expected but each board stays distinct.
    const qs = generateRound(items, 'beginner', 'match', new Set(), createRng(2));
    for (const q of qs) expect(new Set(q.itemIds).size).toBe(5);
  });
});

describe('unlearned priority', () => {
  const beginner = items.filter((i) => i.level === 'beginner');

  it('uses exactly 7 unlearned and 3 learned primaries when both are plentiful', () => {
    // Learn the first 15 of 30 beginner items.
    const learned = learnedOf(beginner.slice(0, 15).map((i) => i.id));
    for (let seed = 0; seed < 20; seed++) {
      const qs = generateRound(items, 'beginner', 'translate', learned, createRng(seed));
      const unlearnedPrimaries = primaryIds(qs).filter((id) => !learned.has(id));
      expect(unlearnedPrimaries.length).toBeLessThanOrEqual(7);
      expect(unlearnedPrimaries.length).toBe(7);
    }
  });

  it('uses every unlearned item when fewer than 7 remain, then reviews learned ones', () => {
    const learned = learnedOf(beginner.slice(0, 27).map((i) => i.id)); // 3 unlearned left
    const qs = generateRound(items, 'beginner', 'translate', learned, createRng(4));
    const unlearnedPrimaries = primaryIds(qs).filter((id) => !learned.has(id));
    expect(unlearnedPrimaries).toHaveLength(3);
  });

  it('falls back to unlearned items when nothing is learned', () => {
    const qs = generateRound(items, 'beginner', 'translate', new Set(), createRng(4));
    expect(qs).toHaveLength(10);
  });

  it('falls back to learned items when everything is learned', () => {
    const learned = learnedOf(beginner.map((i) => i.id));
    const qs = generateRound(items, 'beginner', 'translate', learned, createRng(4));
    expect(qs).toHaveLength(10);
  });
});

describe('Mixed mode', () => {
  it('plays more than one mode (AC13)', () => {
    for (let seed = 0; seed < 30; seed++) {
      const modes = new Set(generateRound(items, 'beginner', 'mixed', new Set(), createRng(seed)).map((q) => q.mode));
      expect(modes.size).toBeGreaterThan(1);
    }
  });

  it('only includes Picture when enough image words exist', () => {
    const noImages = items.map((i) => (i.kind === 'word' ? { ...i, image: undefined } : i));
    expect(eligibleModes(noImages, 'beginner')).not.toContain('picture');
    for (let seed = 0; seed < 10; seed++) {
      const modes = generateRound(noImages, 'beginner', 'mixed', new Set(), createRng(seed)).map((q) => q.mode);
      expect(modes).not.toContain('picture');
    }
  });

  it('only includes Order when sentences exist', () => {
    const noSentences = items.filter((i) => i.kind === 'word');
    expect(eligibleModes(noSentences, 'beginner')).not.toContain('order');
    for (let seed = 0; seed < 10; seed++) {
      const modes = generateRound(noSentences, 'beginner', 'mixed', new Set(), createRng(seed)).map((q) => q.mode);
      expect(modes).not.toContain('order');
    }
  });
});

describe('real content', () => {
  it('can generate every mode at both levels', () => {
    for (const level of ['beginner', 'intermediate'] as const) {
      for (const mode of ['match', 'translate', 'order', 'picture', 'mixed'] as Mode[]) {
        const qs = generateRound(allItems, level, mode, new Set(), createRng(77));
        expect(qs).toHaveLength(10);
      }
    }
  });

  it('keeps intermediate Match boards distinct within a board', () => {
    const qs = generateRound(allItems, 'intermediate', 'match', new Set(), createRng(5));
    for (const q of qs) expect(new Set(q.itemIds).size).toBe(5);
  });
});

describe('generateRound options', () => {
  it('builds the requested number of questions', () => {
    expect(generateRound(items, 'beginner', 'mixed', new Set(), createRng(1), { size: 12 })).toHaveLength(12);
    expect(generateRound(items, 'beginner', 'translate', new Set(), createRng(1), { size: 7 })).toHaveLength(7);
  });

  it('can ignore learned status (neutral)', () => {
    const learned = new Set(items.filter((i) => i.level === 'beginner' && i.kind === 'word').slice(0, 10).map((i) => i.id));
    const qs = generateRound(items, 'beginner', 'translate', learned, createRng(2), { size: 12, neutral: true });
    const primaries = new Set(qs.map((q) => q.itemIds[0]));
    expect([...primaries].some((id) => learned.has(id))).toBe(true);
  });

  it('reuses items instead of failing when the pool is small', () => {
    const few = items.filter((i) => i.kind === 'sentence' && i.level === 'beginner').slice(0, 3);
    expect(generateRound(few, 'beginner', 'order', new Set(), createRng(3), { size: 12 })).toHaveLength(12);
  });
});

describe('Write and Fill the gap questions', () => {
  it('Write asks about words and short sentences only', () => {
    for (let seed = 1; seed <= 10; seed++) {
      for (const q of generateRound(items, 'beginner', 'write', new Set(), createRng(seed))) {
        expect(q.mode).toBe('write');
        expect(q.itemIds).toHaveLength(1);
        const item = byId.get(q.itemIds[0])!;
        if (item.kind === 'sentence') expect(item.tiles.length).toBeLessThanOrEqual(6);
      }
    }
  });

  it('Fill the gap uses sentences and stores the gap and options', () => {
    for (const q of generateRound(items, 'beginner', 'gap', new Set(), createRng(4))) {
      expect(q.mode).toBe('gap');
      const sentence = byId.get(q.itemIds[0])!;
      expect(sentence.kind).toBe('sentence');
      if (sentence.kind !== 'sentence') continue;
      expect(q.gapIndex).toBeGreaterThanOrEqual(0);
      expect(q.gapIndex).toBeLessThan(sentence.tiles.length);
      expect(q.options).toContain(sentence.tiles[q.gapIndex!]);
    }
  });

  it('both modes are eligible and part of Mixed', () => {
    expect(eligibleModes(items, 'beginner')).toEqual(expect.arrayContaining(['write', 'gap']));
    const seen = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      for (const q of generateRound(items, 'beginner', 'mixed', new Set(), createRng(seed))) seen.add(q.mode);
    }
    expect(seen.has('write')).toBe(true);
    expect(seen.has('gap')).toBe(true);
  });
});
