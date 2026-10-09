import type { ItemOutcome } from '../game/types';
import { withRetry } from './retry';
import { requireClient } from './profileRepo';

export interface ItemProgressRow {
  user_id: string;
  item_id: string;
  attempt_count: number;
  correct_count: number;
  first_correct_at: string | null;
  last_seen_at: string;
  /** Spaced repetition (used by Review). */
  ease: number;
  interval_days: number;
  due_on: string | null;
  lapses: number;
}

/** The SRS values a brand new row starts with. */
export const NEW_SRS = { ease: 2.5, interval_days: 1, due_on: null, lapses: 0 } as const;

/**
 * Merge a round's item results into existing progress rows (the client merges
 * counts, then upserts). Pure so it can be tested.
 */
export function mergeAttempts(
  userId: string,
  existing: ReadonlyMap<string, ItemProgressRow>,
  attempts: readonly ItemOutcome[],
  nowIso: string,
): ItemProgressRow[] {
  const merged = new Map<string, ItemProgressRow>();
  for (const attempt of attempts) {
    const base =
      merged.get(attempt.itemId) ??
      existing.get(attempt.itemId) ?? {
        user_id: userId,
        item_id: attempt.itemId,
        attempt_count: 0,
        correct_count: 0,
        first_correct_at: null,
        last_seen_at: nowIso,
        ...NEW_SRS,
      };
    merged.set(attempt.itemId, {
      ...base,
      attempt_count: base.attempt_count + 1,
      correct_count: base.correct_count + (attempt.correct ? 1 : 0),
      first_correct_at: base.first_correct_at ?? (attempt.correct ? nowIso : null),
      last_seen_at: nowIso,
    });
  }
  return [...merged.values()];
}

export function getItemProgress(): Promise<ItemProgressRow[]> {
  return withRetry(async () => {
    const { data, error } = await requireClient().from('item_progress').select('*');
    if (error) throw error;
    return (data ?? []) as ItemProgressRow[];
  });
}

export async function recordAttempts(rows: readonly ItemProgressRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await requireClient().from('item_progress').upsert([...rows], { onConflict: 'user_id,item_id' });
  if (error) throw error;
}
