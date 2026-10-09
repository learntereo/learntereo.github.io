export interface StreakState {
  current_streak: number;
  longest_streak: number;
  /** Local calendar date, YYYY-MM-DD. */
  last_active_date: string | null;
}

/** Format a Date as the learner's local calendar date (YYYY-MM-DD). */
export function toLocalDateString(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add whole days to a YYYY-MM-DD date string (calendar arithmetic, no time zones). */
export function addDays(dateString: string, days: number): string {
  const [y, m, d] = dateString.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const out = new Date(ms);
  return `${String(out.getUTCFullYear()).padStart(4, '0')}-${String(out.getUTCMonth() + 1).padStart(2, '0')}-${String(
    out.getUTCDate(),
  ).padStart(2, '0')}`;
}

/** Streak after completing a round on `today` (local date). */
export function nextStreak(state: StreakState, today: string): StreakState {
  let current: number;
  if (state.last_active_date === today) {
    current = Math.max(state.current_streak, 1);
  } else if (state.last_active_date === addDays(today, -1)) {
    current = state.current_streak + 1;
  } else {
    current = 1;
  }
  return {
    current_streak: current,
    longest_streak: Math.max(state.longest_streak, current),
    last_active_date: today,
  };
}

/** Streak to show: 0 if the learner has not been active today or yesterday. */
export function displayStreak(state: StreakState, today: string): number {
  if (!state.last_active_date) return 0;
  if (state.last_active_date < addDays(today, -1)) return 0;
  return state.current_streak;
}
