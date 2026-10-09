import { requireClient } from './profileRepo';
import { withRetry } from './retry';

export interface UnitProgressRow {
  user_id: string;
  unit_id: string;
  learned_at: string | null;
  completed_at: string | null;
  best_score: number | null;
  attempts: number;
}

export function emptyUnitProgress(userId: string, unitId: string): UnitProgressRow {
  return { user_id: userId, unit_id: unitId, learned_at: null, completed_at: null, best_score: null, attempts: 0 };
}

/** The row after the learner finishes the Learn deck. Keeps the first time. */
export function markLearned(row: UnitProgressRow, nowIso: string): UnitProgressRow {
  return { ...row, learned_at: row.learned_at ?? nowIso };
}

/**
 * The row after a unit check. Every check counts as an attempt and the best
 * score is kept. A pass sets `completed_at` once and never clears it.
 */
export function applyCheckResult(row: UnitProgressRow, score: number, passed: boolean, nowIso: string): UnitProgressRow {
  return {
    ...row,
    attempts: row.attempts + 1,
    best_score: row.best_score === null ? score : Math.max(row.best_score, score),
    completed_at: row.completed_at ?? (passed ? nowIso : null),
  };
}

export function getUnitProgress(): Promise<UnitProgressRow[]> {
  return withRetry(async () => {
    const { data, error } = await requireClient().from('unit_progress').select('*');
    if (error) throw error;
    return (data ?? []) as UnitProgressRow[];
  });
}

export async function saveUnitProgress(row: UnitProgressRow): Promise<void> {
  const { error } = await requireClient().from('unit_progress').upsert(row, { onConflict: 'user_id,unit_id' });
  if (error) throw error;
}
