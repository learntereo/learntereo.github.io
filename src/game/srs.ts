import type { Outcome, Result } from './types';

/** Simplified SM-2 spaced repetition (spec FR7). */
export const EASE_START = 2.5;
export const EASE_MIN = 1.3;
export const EASE_MAX = 3.0;
export const REVIEW_LIMIT = 15;
/** Nothing waits longer than a year between reviews. */
export const MAX_INTERVAL_DAYS = 365;

export interface SrsFields {
  ease: number;
  interval_days: number;
  /** Local date (YYYY-MM-DD) the item is next due, or null if never scheduled. */
  due_on: string | null;
  lapses: number;
}

export const NEW_SRS: SrsFields = { ease: EASE_START, interval_days: 1, due_on: null, lapses: 0 };

/** Keep ease inside the database check (1.3 to 3.0) and free of float drift (2 decimals). */
export function clampEase(ease: number): number {
  const bounded = Math.min(EASE_MAX, Math.max(EASE_MIN, ease));
  return Math.round(bounded * 100) / 100;
}

/** Add whole days to a YYYY-MM-DD date without time zone or daylight saving surprises. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const result = new Date(Date.UTC(y, m - 1, d + days));
  return result.toISOString().slice(0, 10);
}

/**
 * Schedule after one answer.
 * - first try: interval grows by the ease, ease goes up 0.1
 * - retry: interval stays, ease goes down 0.15
 * - missed: interval resets to 1 day, ease goes down 0.2, one more lapse
 */
export function nextSrs(state: SrsFields, result: Result, today: string): SrsFields {
  let { interval_days, lapses } = state;
  let ease = state.ease;
  if (result === 'first') {
    interval_days = Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(interval_days * ease)));
    ease += 0.1;
  } else if (result === 'retry') {
    ease -= 0.15;
  } else {
    interval_days = 1;
    ease -= 0.2;
    lapses += 1;
  }
  return { ease: clampEase(ease), interval_days, due_on: addDays(today, interval_days), lapses };
}

/** What happened to each item in a round, in order. Re-queued replays are ignored. */
export function itemResults(outcomes: readonly Outcome[]): Map<string, Result[]> {
  const byItem = new Map<string, Result[]>();
  for (const outcome of outcomes) {
    if (outcome.requeued) continue;
    for (const item of outcome.items) {
      const result: Result =
        item.result ?? (!item.correct ? 'missed' : outcome.result === 'missed' ? 'retry' : outcome.result);
      const list = byItem.get(item.itemId) ?? [];
      list.push(result);
      byItem.set(item.itemId, list);
    }
  }
  return byItem;
}

/** Apply a round to the progress rows it touched (each item once per answer it gave). */
export function applySrs<T extends SrsFields & { item_id: string }>(
  rows: readonly T[],
  outcomes: readonly Outcome[],
  today: string,
): T[] {
  const results = itemResults(outcomes);
  return rows.map((row) => {
    let state: SrsFields = row;
    for (const result of results.get(row.item_id) ?? []) state = nextSrs(state, result, today);
    return { ...row, ease: state.ease, interval_days: state.interval_days, due_on: state.due_on, lapses: state.lapses };
  });
}

interface DueRow extends SrsFields {
  item_id: string;
  first_correct_at: string | null;
}

/** Learned items due today or earlier, most overdue first, at most `limit`. */
export function selectDue<T extends DueRow>(
  rows: Iterable<T>,
  today: string,
  limit: number = REVIEW_LIMIT,
  exists: (itemId: string) => boolean = () => true,
): T[] {
  return [...rows]
    .filter((r) => r.first_correct_at !== null && r.due_on !== null && r.due_on <= today && exists(r.item_id))
    .sort((a, b) => (a.due_on as string).localeCompare(b.due_on as string) || a.item_id.localeCompare(b.item_id))
    .slice(0, limit);
}

export function countDue<T extends DueRow>(rows: Iterable<T>, today: string, exists?: (itemId: string) => boolean): number {
  return selectDue(rows, today, Infinity, exists).length;
}

/** Learned items that were never scheduled (from before Review existed) become due today. */
export function backfillDueDates<T extends DueRow>(rows: Iterable<T>, today: string): T[] {
  return [...rows]
    .filter((r) => r.first_correct_at !== null && r.due_on === null)
    .map((r) => ({ ...r, due_on: today }));
}
