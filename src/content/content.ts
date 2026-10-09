import type { Content, Item, Level, SentenceItem, WordItem } from '../game/types';
import raw from './content.json';

export const content = raw as unknown as Content;

export const allItems: readonly Item[] = content.items;

export const itemsById: ReadonlyMap<string, Item> = new Map(allItems.map((item) => [item.id, item]));

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
