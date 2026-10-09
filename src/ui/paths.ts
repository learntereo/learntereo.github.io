import { getUnit } from '../content/content';
import type { RoundRow } from '../data/roundRepo';
import { isLevel, isMode } from './labels';

/** True when the stored round has a screen to continue on (its unit and game still exist). */
export function canResume(round: Pick<RoundRow, 'level' | 'mode' | 'unit_id'>): boolean {
  if (round.mode === 'review') return true;
  if (round.mode === 'unit_practice' || round.mode === 'unit_check') return Boolean(round.unit_id && getUnit(round.unit_id));
  return isLevel(round.level) && isMode(round.mode);
}

/** Where a stored round is played. Used to resume it. */
export function roundPath(round: Pick<RoundRow, 'level' | 'mode' | 'unit_id'>, resume = false): string {
  const suffix = resume ? '?resume=1' : '';
  if (round.mode === 'review') return `/review${suffix}`;
  if (round.unit_id && round.mode === 'unit_practice') return `/unit/${round.unit_id}/practice${suffix}`;
  if (round.unit_id && round.mode === 'unit_check') return `/unit/${round.unit_id}/check${suffix}`;
  return `/play/${round.level}/${round.mode}${suffix}`;
}
