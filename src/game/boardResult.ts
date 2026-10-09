import type { Result } from './types';

/** After this many wrong drops of one word, its correct target is shown. */
export const REVEAL_AFTER = 2;

export function shouldReveal(wrongDrops: number): boolean {
  return wrongDrops >= REVEAL_AFTER;
}

/**
 * Board question result: any reveal means missed; otherwise any wrong drop
 * means retry; otherwise first try.
 */
export function boardResult(wrongDropsByWord: Readonly<Record<string, number>>, revealedWords: readonly string[]): Result {
  if (revealedWords.length > 0) return 'missed';
  const anyWrong = Object.values(wrongDropsByWord).some((n) => n > 0);
  return anyWrong ? 'retry' : 'first';
}
