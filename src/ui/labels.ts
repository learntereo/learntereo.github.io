import type { Level, Mode } from '../game/types';

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
};

export const MODE_LABEL: Record<Mode, string> = {
  match: 'Match',
  translate: 'Translate',
  order: 'Order',
  picture: 'Picture',
  mixed: 'Mixed',
};

export const MODE_DESCRIPTION: Record<Mode, string> = {
  match: 'Drag each Māori word onto its English meaning.',
  translate: 'Type the English for a Māori word or sentence.',
  order: 'Drag the Māori words into the right order.',
  picture: 'Drag each Māori word onto its picture.',
  mixed: 'A bit of everything, picked at random.',
};

export function isLevel(value: string | undefined): value is Level {
  return value === 'beginner' || value === 'intermediate';
}

export function isMode(value: string | undefined): value is Mode {
  return value === 'match' || value === 'translate' || value === 'order' || value === 'picture' || value === 'mixed';
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
