import type { Unit, WordItem } from './types';

/** Lowercase and remove accents and macrons, so "kuri" finds "kurī". */
export function foldAccents(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export interface GlossaryEntry {
  id: string;
  mi: string;
  en: string[];
  unitId: string;
  unitTitle: string;
  level: Unit['level'];
}

/** One entry per word of the given units, A to Z by Māori word (macrons ignored when sorting). */
export function glossaryEntries(
  units: readonly Unit[],
  getWord: (id: string) => WordItem | undefined,
): GlossaryEntry[] {
  const entries: GlossaryEntry[] = [];
  for (const unit of units) {
    for (const id of unit.itemIds) {
      const word = getWord(id);
      if (word) {
        entries.push({ id, mi: word.mi, en: word.en, unitId: unit.id, unitTitle: unit.title, level: unit.level });
      }
    }
  }
  return entries.sort((a, b) => foldAccents(a.mi).localeCompare(foldAccents(b.mi)) || a.id.localeCompare(b.id));
}

/**
 * Entries whose Māori or English contains the query, accents ignored.
 * Matches at the start of a word come first. An empty query returns everything.
 */
export function searchGlossary(entries: readonly GlossaryEntry[], query: string): GlossaryEntry[] {
  const q = foldAccents(query);
  if (q === '') return [...entries];

  const rank = (entry: GlossaryEntry): number | null => {
    const mi = foldAccents(entry.mi);
    const en = entry.en.map(foldAccents);
    if (mi === q) return 0;
    if (mi.startsWith(q)) return 1;
    if (en.some((e) => e === q)) return 2;
    if (en.some((e) => e.startsWith(q))) return 3;
    if (mi.includes(q)) return 4;
    if (en.some((e) => e.includes(q))) return 5;
    return null;
  };

  return entries
    .map((entry, index) => ({ entry, index, score: rank(entry) }))
    .filter((x): x is { entry: GlossaryEntry; index: number; score: number } => x.score !== null)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((x) => x.entry);
}
