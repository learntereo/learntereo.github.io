import type { Item, Level } from './types';

export interface ProgressLike {
  item_id: string;
  first_correct_at: string | null;
}

/** Ids of items answered correctly at least once. */
export function learnedIds(rows: readonly ProgressLike[]): Set<string> {
  return new Set(rows.filter((r) => r.first_correct_at !== null).map((r) => r.item_id));
}

export function levelProgress(items: readonly Item[], level: Level, learned: ReadonlySet<string>) {
  const levelItems = items.filter((i) => i.level === level);
  const done = levelItems.filter((i) => learned.has(i.id)).length;
  return { learned: done, total: levelItems.length };
}

/** Beginner is complete when every beginner item has been answered correctly at least once. */
export function isBeginnerComplete(items: readonly Item[], learned: ReadonlySet<string>): boolean {
  const { learned: done, total } = levelProgress(items, 'beginner', learned);
  return total > 0 && done === total;
}
