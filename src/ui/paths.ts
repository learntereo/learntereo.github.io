import type { RoundRow } from '../data/roundRepo';

/** Where a stored round is played. Used to resume it. */
export function roundPath(round: Pick<RoundRow, 'level' | 'mode' | 'unit_id'>, resume = false): string {
  const suffix = resume ? '?resume=1' : '';
  if (round.mode === 'review') return `/review${suffix}`;
  if (round.unit_id && round.mode === 'unit_practice') return `/unit/${round.unit_id}/practice${suffix}`;
  if (round.unit_id && round.mode === 'unit_check') return `/unit/${round.unit_id}/check${suffix}`;
  return `/play/${round.level}/${round.mode}${suffix}`;
}
