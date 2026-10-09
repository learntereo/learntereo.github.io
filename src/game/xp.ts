import type { Outcome, Result } from './types';

export const XP_FIRST_TRY = 10;
export const XP_RETRY = 5;
export const ROUND_BONUS = 20;

export function xpForQuestion(result: Result, requeued: boolean): number {
  if (requeued) return 0;
  if (result === 'first') return XP_FIRST_TRY;
  if (result === 'retry') return XP_RETRY;
  return 0;
}

export function xpForRound(outcomes: readonly Outcome[]): number {
  return outcomes.reduce((sum, o) => sum + xpForQuestion(o.result, o.requeued), 0) + ROUND_BONUS;
}

/** Score out of the original questions: first try or retry both count. */
export function roundScore(outcomes: readonly Outcome[]): number {
  return outcomes.filter((o) => !o.requeued && o.result !== 'missed').length;
}
