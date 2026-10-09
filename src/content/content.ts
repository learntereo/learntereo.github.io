import unitIndex from './unitIndex.json';
import type { Item, Level, SentenceItem, Unit, UnitFile, WordItem } from '../game/types';

/*
 * Unit headers (title, order, item ids) live in unitIndex.json, built from the
 * unit files by `npm run content:index`. They are small and always available:
 * the Path needs them to work out which units are open. The words, sentences
 * and grammar notes are loaded one level at a time (loadLevels), so the app
 * only downloads the levels a learner has reached.
 */

const unitLoaders: Record<Level, Record<string, () => Promise<UnitFile>>> = {
  beginner: import.meta.glob<UnitFile>('./units/b*.json', { import: 'default' }),
  intermediate: import.meta.glob<UnitFile>('./units/i*.json', { import: 'default' }),
  advanced: import.meta.glob<UnitFile>('./units/a*.json', { import: 'default' }),
};

const grammarLoaders: Record<Level, Record<string, () => Promise<string>>> = {
  beginner: import.meta.glob<string>('./grammar/b*.md', { import: 'default', query: '?raw' }),
  intermediate: import.meta.glob<string>('./grammar/i*.md', { import: 'default', query: '?raw' }),
  advanced: import.meta.glob<string>('./grammar/a*.md', { import: 'default', query: '?raw' }),
};

export const LEVEL_ORDER: readonly Level[] = ['beginner', 'intermediate', 'advanced'];

/** Every unit in path order: Beginner, then Intermediate, then Advanced. */
export const units: readonly Unit[] = [...(unitIndex as Unit[])].sort(
  (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) || a.order - b.order,
);

export const unitsById: ReadonlyMap<string, Unit> = new Map(units.map((u) => [u.id, u]));

const unitByItemId: ReadonlyMap<string, Unit> = new Map(units.flatMap((u) => u.itemIds.map((id): [string, Unit] => [id, u])));

/** Ids of every item in the course, loaded or not. */
export function isKnownItem(id: string): boolean {
  return unitByItemId.has(id);
}

export const totalItemCount = unitByItemId.size;

// ---- levels that have been loaded (filled in place by loadLevels) ----------

const loadedItems: Item[] = [];
const loadedById = new Map<string, Item>();
const loadedGrammar = new Map<string, string>();
const loadedLevels = new Set<Level>();
const inflight = new Map<Level, Promise<void>>();

export const allItems: readonly Item[] = loadedItems;
export const itemsById: ReadonlyMap<string, Item> = loadedById;
/** Grammar note Markdown keyed by grammar id (the file name without extension). */
export const grammarNotes: ReadonlyMap<string, string> = loadedGrammar;

const byPath = <T>(record: Record<string, () => Promise<T>>) =>
  Object.entries(record).sort(([a], [b]) => a.localeCompare(b));

async function fetchLevel(level: Level): Promise<void> {
  const [files, notes] = await Promise.all([
    Promise.all(byPath(unitLoaders[level]).map(async ([, load]) => load())),
    Promise.all(byPath(grammarLoaders[level]).map(async ([file, load]) => [file, await load()] as const)),
  ]);
  if (loadedLevels.has(level)) return;
  for (const file of files.sort((a, b) => a.unit.order - b.unit.order)) {
    for (const item of file.items) {
      loadedItems.push(item);
      loadedById.set(item.id, item);
    }
  }
  for (const [file, text] of notes) loadedGrammar.set(file.replace(/^.*\//, '').replace(/\.md$/, ''), text);
  loadedLevels.add(level);
}

export function isLevelLoaded(level: Level): boolean {
  return loadedLevels.has(level);
}

/** Download the words, sentences and grammar notes of the given levels (once each). */
export function loadLevels(levels: readonly Level[]): Promise<void> {
  const pending = LEVEL_ORDER.filter((level) => levels.includes(level) && !loadedLevels.has(level)).map((level) => {
    let promise = inflight.get(level);
    if (!promise) {
      promise = fetchLevel(level).finally(() => inflight.delete(level));
      inflight.set(level, promise);
    }
    return promise;
  });
  return Promise.all(pending).then(() => undefined);
}

// ---- lookups ------------------------------------------------------------------

export function isWord(item: Item): item is WordItem {
  return item.kind === 'word';
}

export function isSentence(item: Item): item is SentenceItem {
  return item.kind === 'sentence';
}

export function itemsForLevel(level: Level, items: readonly Item[] = allItems): Item[] {
  return items.filter((item) => item.level === level);
}

export function wordsForLevel(level: Level, items: readonly Item[] = allItems): WordItem[] {
  return itemsForLevel(level, items).filter(isWord);
}

export function sentencesForLevel(level: Level, items: readonly Item[] = allItems): SentenceItem[] {
  return itemsForLevel(level, items).filter(isSentence);
}

export function imageWordsForLevel(level: Level, items: readonly Item[] = allItems): WordItem[] {
  return wordsForLevel(level, items).filter((word) => word.image !== undefined);
}

export function getItem(id: string): Item | undefined {
  return itemsById.get(id);
}

export function getUnit(id: string | undefined): Unit | undefined {
  return id === undefined ? undefined : unitsById.get(id);
}

export function unitForItem(itemId: string): Unit | undefined {
  return unitByItemId.get(itemId);
}

export function unitsForLevel(level: Level): Unit[] {
  return units.filter((u) => u.level === level);
}

/** Items of a unit, in the order they are listed in its file (its level must be loaded). */
export function itemsForUnit(unit: Unit): Item[] {
  return unit.itemIds.map((id) => itemsById.get(id)).filter((i): i is Item => i !== undefined);
}

export function wordsForUnit(unit: Unit): WordItem[] {
  return itemsForUnit(unit).filter(isWord);
}

export function sentencesForUnit(unit: Unit): SentenceItem[] {
  return itemsForUnit(unit).filter(isSentence);
}

export function grammarFor(unit: Unit): string | undefined {
  return grammarNotes.get(unit.grammar);
}

/** The unit that follows this one on the path, if any. */
export function nextUnit(unit: Unit): Unit | undefined {
  const index = units.findIndex((u) => u.id === unit.id);
  return index >= 0 ? units[index + 1] : undefined;
}
