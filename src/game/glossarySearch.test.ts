import { describe, expect, it } from 'vitest';
import { getItem, isWord, units } from '../content/content';
import { foldAccents, glossaryEntries, searchGlossary, type GlossaryEntry } from './glossarySearch';
import type { Unit, WordItem } from './types';

const entry = (mi: string, en: string[], id = mi): GlossaryEntry => ({
  id,
  mi,
  en,
  unitId: 'u',
  unitTitle: 'Unit',
  level: 'beginner',
});

describe('foldAccents', () => {
  it('removes macrons and case', () => {
    expect(foldAccents('Kurī')).toBe('kuri');
    expect(foldAccents('  Whānau  ')).toBe('whanau');
    expect(foldAccents('ĀĒĪŌŪ')).toBe('aeiou');
  });
});

describe('searchGlossary (AC11)', () => {
  const entries = [
    entry('kurī', ['dog']),
    entry('kuri', ['a different word'], 'kuri2'),
    entry('kūmara', ['sweet potato']),
    entry('ngeru', ['cat']),
    entry('tūī', ['tui']),
    entry('rākau', ['tree', 'wood']),
  ];

  it('finds kurī when searching "kuri"', () => {
    const results = searchGlossary(entries, 'kuri');
    expect(results.map((r) => r.mi)).toContain('kurī');
    expect(results.map((r) => r.mi)).toEqual(['kurī', 'kuri']); // both fold to the same word
  });

  it('finds a macron word when the macron is typed', () => {
    expect(searchGlossary(entries, 'kurī').map((r) => r.mi)).toContain('kurī');
  });

  it('searches English too', () => {
    expect(searchGlossary(entries, 'sweet').map((r) => r.mi)).toEqual(['kūmara']);
    expect(searchGlossary(entries, 'WOOD').map((r) => r.mi)).toEqual(['rākau']);
  });

  it('ranks prefix matches before substring matches', () => {
    const list = [entry('pukapuka', ['book']), entry('puka', ['hole']), entry('kapu', ['cup'])];
    expect(searchGlossary(list, 'puka').map((r) => r.mi)).toEqual(['puka', 'pukapuka']);
    expect(searchGlossary(list, 'ka').map((r) => r.mi)).toEqual(['kapu', 'pukapuka', 'puka']);
  });

  it('returns everything for an empty query and nothing for no match', () => {
    expect(searchGlossary(entries, '')).toHaveLength(entries.length);
    expect(searchGlossary(entries, '   ')).toHaveLength(entries.length);
    expect(searchGlossary(entries, 'zzzz')).toEqual([]);
  });
});

describe('glossaryEntries', () => {
  it('lists the words of the given units alphabetically, ignoring macrons', () => {
    const open: Unit[] = units.filter((u) => u.level === 'beginner').slice(0, 5);
    const list = glossaryEntries(open, (id) => {
      const item = getItem(id);
      return item && isWord(item) ? (item as WordItem) : undefined;
    });
    const expectedCount = open.reduce((n, u) => n + u.itemIds.filter((id) => getItem(id)?.kind === 'word').length, 0);
    expect(list).toHaveLength(expectedCount);
    const folded = list.map((e) => foldAccents(e.mi));
    expect(folded).toEqual([...folded].sort((a, b) => a.localeCompare(b)));
    expect(list.every((e) => open.some((u) => u.id === e.unitId))).toBe(true);
  });

  it('finds kurī: dog in the real course', () => {
    const list = glossaryEntries(units, (id) => {
      const item = getItem(id);
      return item && isWord(item) ? item : undefined;
    });
    const hit = searchGlossary(list, 'kuri').find((e) => e.mi === 'kurī');
    expect(hit?.en[0]).toBe('dog');
  });
});
