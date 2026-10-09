import { MODES, type Level, type Mode, type RoundMode } from '../game/types';

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const MODE_LABEL: Record<Mode, string> = {
  match: 'Match',
  picture: 'Picture',
  translate: 'Translate',
  write: 'Write',
  gap: 'Fill the gap',
  order: 'Order',
  mixed: 'Mixed',
};

/** Labels for every stored round, including path rounds. */
export const ROUND_MODE_LABEL: Record<RoundMode, string> = {
  ...MODE_LABEL,
  unit_practice: 'Unit practice',
  unit_check: 'Kiwiz',
  review: 'Review',
};

export const MODE_DESCRIPTION: Record<Mode, string> = {
  match: 'Drag each Māori word onto its English meaning.',
  translate: 'Type the English for a Māori word or sentence.',
  write: 'Write the Māori for an English word or short sentence.',
  gap: 'Fill the missing word in a Māori sentence.',
  order: 'Drag the Māori words into the right order.',
  picture: 'Drag each Māori word onto its picture.',
  mixed: 'A bit of everything, picked at random.',
};

export function isLevel(value: string | undefined): value is Level {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced';
}

export function isMode(value: string | undefined): value is Mode {
  return MODES.includes(value as Mode);
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
