import { describe, expect, it } from 'vitest';
import { makeItems, makeSentence } from './__fixtures__/items';
import { buildBank, checkOrder, decoyCountForLevel, pickDecoys } from './orderCheck';
import { createRng } from './rng';
import type { SentenceItem } from './types';

const sentence: SentenceItem = {
  ...makeSentence(1),
  tiles: ['ka', 'haere', 'ahau', 'āpōpō'],
  altOrders: [['āpōpō', 'ka', 'haere', 'ahau']],
  decoys: ['kei'],
};

describe('checkOrder', () => {
  it('accepts the canonical order', () => {
    expect(checkOrder(['ka', 'haere', 'ahau', 'āpōpō'], sentence)).toBe(true);
  });

  it('accepts an alternative order', () => {
    expect(checkOrder(['āpōpō', 'ka', 'haere', 'ahau'], sentence)).toBe(true);
  });

  it('rejects a wrong order', () => {
    expect(checkOrder(['haere', 'ka', 'ahau', 'āpōpō'], sentence)).toBe(false);
  });

  it('rejects an incomplete or over-long answer', () => {
    expect(checkOrder(['ka', 'haere', 'ahau'], sentence)).toBe(false);
    expect(checkOrder(['ka', 'haere', 'ahau', 'āpōpō', 'ahau'], sentence)).toBe(false);
    expect(checkOrder([], sentence)).toBe(false);
  });

  it('rejects an answer that includes a decoy', () => {
    expect(checkOrder(['ka', 'haere', 'ahau', 'āpōpō', 'kei'], sentence)).toBe(false);
    expect(checkOrder(['kei', 'haere', 'ahau', 'āpōpō'], sentence)).toBe(false);
  });

  it('is case sensitive and macron sensitive', () => {
    expect(checkOrder(['Ka', 'haere', 'ahau', 'āpōpō'], sentence)).toBe(false);
    expect(checkOrder(['ka', 'haere', 'ahau', 'apopo'], sentence)).toBe(false);
  });

  it('ignores trailing punctuation tiles', () => {
    expect(checkOrder(['ka', 'haere', 'ahau', 'āpōpō', '.'], sentence)).toBe(true);
    expect(checkOrder(['ka', 'haere', 'ahau', 'āpōpō', '?', '!'], sentence)).toBe(true);
  });

  it('handles repeated tiles by position', () => {
    const repeated: SentenceItem = { ...sentence, tiles: ['kei', 'te', 'haere', 'ahau', 'ki', 'te', 'kura'], altOrders: [] };
    expect(checkOrder(['kei', 'te', 'haere', 'ahau', 'ki', 'te', 'kura'], repeated)).toBe(true);
    expect(checkOrder(['kei', 'te', 'haere', 'ahau', 'te', 'ki', 'kura'], repeated)).toBe(false);
  });
});

describe('decoys', () => {
  it('uses 1 decoy for beginner and 2 for intermediate', () => {
    expect(decoyCountForLevel('beginner')).toBe(1);
    expect(decoyCountForLevel('intermediate')).toBe(2);
  });

  it('uses the sentence decoys when enough are defined', () => {
    const s = { ...makeSentence(1), decoys: ['aa', 'bb', 'cc'] };
    const picked = pickDecoys(s, [], createRng(1));
    expect(picked).toHaveLength(1);
    expect(['aa', 'bb', 'cc']).toContain(picked[0]);
  });

  it('tops up from other same-level sentences when too few are defined', () => {
    const items = makeItems().filter((i): i is SentenceItem => i.kind === 'sentence' && i.level === 'intermediate');
    const target = { ...items[0], decoys: ['only'] };
    const picked = pickDecoys(target, items, createRng(7));
    expect(picked).toHaveLength(2);
    expect(picked).toContain('only');
    for (const d of picked) expect(target.tiles).not.toContain(d);
    expect(new Set(picked).size).toBe(2);
  });

  it('never picks a decoy that is one of the sentence tiles', () => {
    const items = makeItems().filter((i): i is SentenceItem => i.kind === 'sentence' && i.level === 'beginner');
    for (let seed = 0; seed < 20; seed++) {
      const target = { ...items[1], decoys: undefined };
      const picked = pickDecoys(target, items, createRng(seed));
      expect(picked).toHaveLength(1);
      expect(target.tiles).not.toContain(picked[0]);
    }
  });

  it('builds a shuffled bank with every tile plus the decoys (AC10)', () => {
    const bank = buildBank(sentence.tiles, ['kei'], createRng(3));
    expect(bank).toHaveLength(5);
    expect([...bank.map((b) => b.text)].sort()).toEqual([...sentence.tiles, 'kei'].sort());
    expect(new Set(bank.map((b) => b.id)).size).toBe(5);
    expect(bank.filter((b) => b.decoy)).toHaveLength(1);
  });
});
