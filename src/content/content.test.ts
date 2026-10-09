import { describe, expect, it } from 'vitest';
import { allItems, imageWordsForLevel, itemsById, sentencesForLevel, wordsForLevel } from './content';
import { icons } from './icons';

const strip = (s: string) =>
  s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const LEVELS = ['beginner', 'intermediate'] as const;

describe('content counts', () => {
  it('has 60 beginner and 40 intermediate words', () => {
    expect(wordsForLevel('beginner')).toHaveLength(60);
    expect(wordsForLevel('intermediate')).toHaveLength(40);
  });

  it('has 20 beginner and 20 intermediate sentences', () => {
    expect(sentencesForLevel('beginner')).toHaveLength(20);
    expect(sentencesForLevel('intermediate')).toHaveLength(20);
  });

  it('has enough image words for Picture mode', () => {
    expect(imageWordsForLevel('beginner').length).toBeGreaterThanOrEqual(30);
    expect(imageWordsForLevel('intermediate').length).toBeGreaterThanOrEqual(20);
  });
});

describe('content integrity', () => {
  it('has unique ids', () => {
    expect(itemsById.size).toBe(allItems.length);
  });

  it('has required fields on every item', () => {
    for (const item of allItems) {
      expect(item.id).toMatch(/^[ws]-[bi]-\d{3}$/);
      expect(item.mi.trim().length).toBeGreaterThan(0);
      expect(item.en.length).toBeGreaterThan(0);
      for (const answer of item.en) expect(answer.trim().length).toBeGreaterThan(0);
      expect(item.mi).toBe(item.mi.normalize('NFC'));
    }
  });

  it('keeps ids consistent with kind and level', () => {
    for (const item of allItems) {
      expect(item.id[0]).toBe(item.kind === 'word' ? 'w' : 's');
      expect(item.id[2]).toBe(item.level === 'beginner' ? 'b' : 'i');
    }
  });

  it('only uses Latin letters plus precomposed macron vowels', () => {
    for (const item of allItems) {
      expect(item.mi).toMatch(/^[A-Za-zāēīōūĀĒĪŌŪ ]+$/);
    }
  });

  it('has no duplicate Māori words within a level', () => {
    for (const level of LEVELS) {
      const words = wordsForLevel(level).map((w) => w.mi.toLowerCase());
      expect(new Set(words).size).toBe(words.length);
    }
  });

  it('does not repeat a canonical English meaning within a level (keeps Match unambiguous)', () => {
    for (const level of LEVELS) {
      const meanings = wordsForLevel(level).map((w) => w.en[0].toLowerCase());
      expect(new Set(meanings).size).toBe(meanings.length);
    }
  });
});

describe('sentences', () => {
  it('has non-empty tiles that join to the Māori sentence', () => {
    for (const level of LEVELS) {
      for (const s of sentencesForLevel(level)) {
        expect(s.tiles.length).toBeGreaterThan(1);
        for (const tile of s.tiles) expect(tile.trim()).toBe(tile);
        expect(strip(s.tiles.join(' '))).toBe(strip(s.mi));
      }
    }
  });

  it('keeps decoys out of the tiles and defines enough of them', () => {
    for (const level of LEVELS) {
      const need = level === 'beginner' ? 1 : 2;
      for (const s of sentencesForLevel(level)) {
        expect((s.decoys ?? []).length).toBeGreaterThanOrEqual(need);
        for (const decoy of s.decoys ?? []) expect(s.tiles).not.toContain(decoy);
      }
    }
  });

  it('has altOrders that are permutations of the tiles', () => {
    for (const level of LEVELS) {
      for (const s of sentencesForLevel(level)) {
        for (const alt of s.altOrders ?? []) {
          expect([...alt].sort()).toEqual([...s.tiles].sort());
        }
      }
    }
  });
});

describe('images', () => {
  it('has images only on words, with valid emoji or known svg ids', () => {
    for (const item of allItems) {
      if (item.kind === 'sentence') {
        expect('image' in item).toBe(false);
        continue;
      }
      if (!item.image) continue;
      if ('emoji' in item.image) {
        expect(item.image.emoji).toMatch(/\p{Extended_Pictographic}/u);
      } else {
        expect(Object.keys(icons)).toContain(item.image.svg);
      }
    }
  });

  it('does not reuse an image within a level', () => {
    for (const level of LEVELS) {
      const images = imageWordsForLevel(level).map((w) => JSON.stringify(w.image));
      expect(new Set(images).size).toBe(images.length);
    }
  });
});
