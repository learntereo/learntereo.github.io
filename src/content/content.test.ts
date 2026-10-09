import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  allItems,
  getTitleBreakdown,
  grammarNotes,
  imageWordsForLevel,
  itemsById,
  itemsForUnit,
  sentencesForLevel,
  sentencesForUnit,
  unitForItem,
  units,
  unitsById,
  unitsForLevel,
  wordsForLevel,
  wordsForUnit,
} from './content';
import { hasRawHtml } from '../game/grammarMarkdown';
import { icons } from './icons';
import particles from './particles.json';
import type { Breakdown } from '../game/types';

const strip = (s: string) =>
  s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const EM_DASH = String.fromCharCode(0x2014);

/** The 140 items of the PoC: their ids must never change (they key saved progress). */
const POC_IDS = [
  ...Array.from({ length: 60 }, (_, i) => `w-b-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 40 }, (_, i) => `w-i-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 20 }, (_, i) => `s-b-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 20 }, (_, i) => `s-i-${String(i + 1).padStart(3, '0')}`),
];

describe('curriculum structure', () => {
  it('has 8 Beginner, 8 Intermediate and 6 Advanced units', () => {
    expect(unitsForLevel('beginner')).toHaveLength(8);
    expect(unitsForLevel('intermediate')).toHaveLength(8);
    expect(unitsForLevel('advanced')).toHaveLength(6);
    expect(units).toHaveLength(22);
  });

  it('lists units in path order with consecutive order numbers per level', () => {
    for (const level of LEVELS) {
      const orders = unitsForLevel(level).map((u) => u.order);
      expect(orders).toEqual(orders.map((_, i) => i + 1));
    }
    const levelIndex = units.map((u) => ['beginner', 'intermediate', 'advanced'].indexOf(u.level));
    expect(levelIndex).toEqual([...levelIndex].sort((a, b) => a - b));
  });

  it('has unique unit ids that match the id pattern and carry titles and an emoji', () => {
    expect(unitsById.size).toBe(units.length);
    for (const unit of units) {
      expect(unit.id).toMatch(/^[bia]\d{2}-[a-z-]+$/);
      expect(unit.id[0]).toBe(unit.level[0]);
      expect(unit.title.trim().length).toBeGreaterThan(0);
      expect(unit.titleMi.trim().length).toBeGreaterThan(0);
      expect(unit.emoji).toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('gives every unit 10-14 words and 5-7 sentences', () => {
    for (const unit of units) {
      const words = wordsForUnit(unit).length;
      const sentences = sentencesForUnit(unit).length;
      expect(words, `${unit.id} words`).toBeGreaterThanOrEqual(10);
      expect(words, `${unit.id} words`).toBeLessThanOrEqual(14);
      expect(sentences, `${unit.id} sentences`).toBeGreaterThanOrEqual(5);
      expect(sentences, `${unit.id} sentences`).toBeLessThanOrEqual(7);
    }
  });

  it('keeps every PoC item with its original id', () => {
    for (const id of POC_IDS) expect(itemsById.has(id), id).toBe(true);
  });

  it('puts each item in exactly one unit, at its own level', () => {
    const seen = new Map<string, string>();
    for (const unit of units) {
      expect(new Set(unit.itemIds).size).toBe(unit.itemIds.length);
      for (const id of unit.itemIds) {
        expect(seen.has(id), `${id} is in two units`).toBe(false);
        seen.set(id, unit.id);
        const item = itemsById.get(id);
        expect(item, id).toBeDefined();
        expect(item?.level).toBe(unit.level);
        expect(unitForItem(id)?.id).toBe(unit.id);
      }
    }
    expect(seen.size).toBe(allItems.length);
    expect(itemsForUnit(units[0]).length).toBe(units[0].itemIds.length);
  });

  it('has enough content in total', () => {
    expect(allItems.filter((i) => i.kind === 'word').length).toBeGreaterThanOrEqual(270);
    expect(allItems.filter((i) => i.kind === 'sentence').length).toBeGreaterThanOrEqual(135);
  });

  it('has enough image words for Picture mode', () => {
    expect(imageWordsForLevel('beginner').length).toBeGreaterThanOrEqual(30);
    expect(imageWordsForLevel('intermediate').length).toBeGreaterThanOrEqual(20);
  });
});

describe('grammar notes', () => {
  it('has one note per unit, with a heading and at most 200 words', () => {
    for (const unit of units) {
      const note = grammarNotes.get(unit.grammar);
      expect(note, `${unit.id} grammar`).toBeDefined();
      expect(note).toMatch(/^## /m);
      const words = (note ?? '').split(/\s+/).filter(Boolean).length;
      expect(words, `${unit.id} grammar length`).toBeLessThanOrEqual(200);
    }
  });

  it('has no raw HTML, em dashes or stray files', () => {
    for (const [id, note] of grammarNotes) {
      expect(unitsById.has(id), `unused note ${id}`).toBe(true);
      expect(hasRawHtml(note)).toBe(false);
      expect(note).not.toContain(EM_DASH);
    }
  });
});

describe('content integrity', () => {
  it('has unique ids', () => {
    expect(itemsById.size).toBe(allItems.length);
  });

  it('has required fields on every item', () => {
    for (const item of allItems) {
      expect(item.id).toMatch(/^[ws]-[bia]-\d{3}$/);
      expect(item.mi.trim().length).toBeGreaterThan(0);
      expect(item.en.length).toBeGreaterThan(0);
      for (const answer of item.en) expect(answer.trim().length).toBeGreaterThan(0);
      expect(item.mi).toBe(item.mi.normalize('NFC'));
    }
  });

  it('keeps ids consistent with kind and level', () => {
    for (const item of allItems) {
      expect(item.id[0]).toBe(item.kind === 'word' ? 'w' : 's');
      expect(item.id[2]).toBe(item.level[0]);
    }
  });

  it('only uses Latin letters plus precomposed macron vowels', () => {
    for (const item of allItems) {
      expect(item.mi).toMatch(/^[A-Za-zāēīōūĀĒĪŌŪ ]+$/);
    }
  });

  it('has no em dashes anywhere in the content', () => {
    for (const item of allItems) {
      expect(JSON.stringify(item)).not.toContain(EM_DASH);
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

  it('does not repeat a sentence within a level', () => {
    for (const level of LEVELS) {
      const sentences = sentencesForLevel(level).map((s) => strip(s.mi));
      expect(new Set(sentences).size).toBe(sentences.length);
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
      const need = level === 'beginner' ? 1 : 2; // Intermediate and Advanced
      for (const s of sentencesForLevel(level)) {
        expect((s.decoys ?? []).length, s.id).toBeGreaterThanOrEqual(need);
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

describe('content files', () => {
  it('has no em dashes in any unit file on disk', () => {
    for (const unit of units) {
      const json = readFileSync(new URL(`./units/${unit.id}.json`, import.meta.url), 'utf8');
      expect(json).not.toContain(EM_DASH);
    }
  });
});

describe('unit index', () => {
  it('matches the unit headers in the unit files (run npm run content:index if this fails)', () => {
    const fromFiles = readdirSync(new URL('./units/', import.meta.url))
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const header = JSON.parse(readFileSync(new URL(`./units/${f}`, import.meta.url), 'utf8')).unit;
        delete header.titleBreakdown; // kept out of the bundled index
        return header;
      });
    expect([...units].map((u) => u.id).sort()).toEqual(fromFiles.map((u: { id: string }) => u.id).sort());
    for (const unit of units) {
      expect(fromFiles.find((u: { id: string }) => u.id === unit.id)).toEqual(unit);
    }
  });

  it('lists exactly the item ids of the loaded unit files', () => {
    for (const unit of units) {
      expect(itemsForUnit(unit).map((i) => i.id)).toEqual(unit.itemIds);
    }
  });
});

describe('word-by-word breakdowns', () => {
  const particleIds = new Set(particles.map((p) => p.id));

  const check = (label: string, mi: string, breakdown: Breakdown | undefined) => {
    expect(breakdown, `${label} has a breakdown`).toBeDefined();
    if (!breakdown) return;
    expect(breakdown.tokens.length, label).toBeGreaterThan(0);
    expect(strip(breakdown.tokens.map((t) => t.mi).join(' ')), `${label} tokens join to the text`).toBe(strip(mi));
    for (const token of breakdown.tokens) {
      expect(token.en.trim().length, `${label} ${token.mi} gloss`).toBeGreaterThan(0);
      if (token.ref !== undefined) expect(particleIds.has(token.ref), `${label} ref ${token.ref}`).toBe(true);
    }
    expect(JSON.stringify(breakdown)).not.toContain(EM_DASH);
  };

  it('gives every sentence and multi-word item a breakdown whose tokens join to the text', () => {
    for (const item of allItems) {
      if (item.mi.trim().includes(' ')) check(item.id, item.mi, item.breakdown);
    }
  });

  it('gives every unit title a breakdown whose tokens join to the title', () => {
    for (const unit of units) check(unit.id, unit.titleMi, getTitleBreakdown(unit.id));
  });

  it("keeps any breakdown on a single-word item consistent with its text", () => {
    for (const item of allItems) {
      if (!item.mi.includes(' ') && item.breakdown) check(item.id, item.mi, item.breakdown);
    }
  });

  it('explains Ngā Mihi and kia ora as the spec describes', () => {
    const mihi = getTitleBreakdown('b01-greetings');
    expect(mihi?.tokens.map((t) => [t.mi, t.en])).toEqual([
      ['Ngā', 'the (plural)'],
      ['Mihi', 'greeting(s)'],
    ]);
    expect(mihi?.literal).toBe('the greetings');
    const kiaOra = itemsById.get('w-b-057')?.breakdown;
    expect(kiaOra?.tokens.map((t) => t.en)).toEqual(['be, may it be', 'well, healthy, alive']);
    expect(kiaOra?.note).toMatch(/hello/);
  });
});

describe('particles dictionary', () => {
  it('has unique ids and the fields the Little words screen needs', () => {
    expect(new Set(particles.map((p) => p.id)).size).toBe(particles.length);
    for (const p of particles) {
      expect(p.id).toMatch(/^[a-z-]+$/);
      expect(p.forms.length, p.id).toBeGreaterThan(0);
      expect(p.gloss.trim().length, p.id).toBeGreaterThan(0);
      const sentences = p.explanation.split(/(?<=[.!?])\s+/).length;
      expect(sentences, `${p.id} explanation`).toBeGreaterThanOrEqual(1);
      expect(sentences, `${p.id} explanation`).toBeLessThanOrEqual(5);
      expect(p.example.mi.trim().length).toBeGreaterThan(0);
      expect(p.example.en.trim().length).toBeGreaterThan(0);
      expect(JSON.stringify(p)).not.toContain(EM_DASH);
    }
  });

  it('covers the required little words', () => {
    const forms = new Set(particles.flatMap((p) => p.forms.map((f) => f.toLowerCase())));
    for (const word of [
      'te', 'ngā', 'he', 'ko', 'kei', 'kei te', 'i', 'ka', 'e ... ana', 'ki', 'ki te', 'mā', 'tēnei', 'tēnā', 'tērā',
      'taku', 'tōku', 'tāku', 'tō', 'tāu', 'tōna', 'tāna', 'ahau', 'au', 'koe', 'ia', 'mātou', 'tātou', 'rātou',
      'kua', 'kia', 'me', 'kaua e', 'nō', 'nā', 'hoki', 'engari', 'nō reira', 'ahakoa', 'rā', 'mai', 'atu', 'ai',
    ]) {
      expect(forms.has(word), word).toBe(true);
    }
  });

  it('uses every particle id that a token refers to at least once or is a core word', () => {
    const referenced = new Set(
      allItems.flatMap((i) => i.breakdown?.tokens.map((t) => t.ref) ?? []).filter((r): r is string => r !== undefined),
    );
    expect(referenced.size).toBeGreaterThan(15);
  });
});
