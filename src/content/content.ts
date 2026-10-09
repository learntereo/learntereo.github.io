import type { Item, Level, SentenceItem, Unit, UnitFile, WordItem } from '../game/types';

const unitModules = import.meta.glob<UnitFile>('./units/*.json', { eager: true, import: 'default' });
const grammarModules = import.meta.glob<string>('./grammar/*.md', { eager: true, import: 'default', query: '?raw' });

const LEVEL_ORDER: readonly Level[] = ['beginner', 'intermediate', 'advanced'];

function sortUnits(files: readonly UnitFile[]): UnitFile[] {
  return [...files].sort(
    (a, b) =>
      LEVEL_ORDER.indexOf(a.unit.level) - LEVEL_ORDER.indexOf(b.unit.level) || a.unit.order - b.unit.order,
  );
}

const unitFiles: readonly UnitFile[] = sortUnits(Object.values(unitModules));

/** Every unit in path order: Beginner, then Intermediate, then Advanced. */
export const units: readonly Unit[] = unitFiles.map((f) => f.unit);

export const unitsById: ReadonlyMap<string, Unit> = new Map(units.map((u) => [u.id, u]));

export const allItems: readonly Item[] = unitFiles.flatMap((f) => f.items);

export const itemsById: ReadonlyMap<string, Item> = new Map(allItems.map((item) => [item.id, item]));

/** Grammar note Markdown keyed by grammar id (the file name without extension). */
export const grammarNotes: ReadonlyMap<string, string> = new Map(
  Object.entries(grammarModules).map(([file, text]) => [file.replace(/^.*\//, '').replace(/\.md$/, ''), text]),
);

const unitByItemId: ReadonlyMap<string, Unit> = new Map(
  unitFiles.flatMap((f) => f.items.map((item): [string, Unit] => [item.id, f.unit])),
);

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

/** Items of a unit, in the order they are listed in its file. */
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
