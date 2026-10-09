import { levenshtein } from './levenshtein';

export const MACRON_VOWELS_LOWER = ['ā', 'ē', 'ī', 'ō', 'ū'] as const;
export const MACRON_VOWELS_UPPER = ['Ā', 'Ē', 'Ī', 'Ō', 'Ū'] as const;

const MACRON_TO_PLAIN: Readonly<Record<string, string>> = {
  ā: 'a', ē: 'e', ī: 'i', ō: 'o', ū: 'u', Ā: 'A', Ē: 'E', Ī: 'I', Ō: 'O', Ū: 'U',
};

/** Replace macron vowels with plain vowels ("kurī" becomes "kuri"). */
export function stripMacrons(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[āēīōūĀĒĪŌŪ]/g, (ch) => MACRON_TO_PLAIN[ch])
    .replace(/[̄]/g, '');
}

/** Lowercase, NFC, drop punctuation, collapse spaces. Macrons are kept. */
export function normaliseMaori(input: string): string {
  return input
    .normalize('NFC')
    // Combining macron typed after a plain vowel becomes the precomposed letter.
    .toLowerCase()
    .replace(/['‘’`"“”]/g, '')
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Typos are only forgiven in longer answers: short Māori words are too easy to confuse. */
export function writeTolerance(target: string): number {
  if (target.length <= 4) return 0;
  return target.length <= 10 ? 1 : 2;
}

export type WriteVerdict =
  /** Exactly right, macrons included. */
  | { kind: 'exact' }
  /** Right except for missing or extra macrons. Counts as correct. */
  | { kind: 'macron' }
  /** A small slip in a longer answer. Counts as correct. */
  | { kind: 'typo' }
  | { kind: 'wrong' };

export function markWrite(input: string, target: string): WriteVerdict {
  const given = normaliseMaori(input);
  const want = normaliseMaori(target);
  if (given === '' || want === '') return { kind: 'wrong' };
  if (given === want) return { kind: 'exact' };
  const givenPlain = stripMacrons(given);
  const wantPlain = stripMacrons(want);
  if (givenPlain === wantPlain) return { kind: 'macron' };
  if (levenshtein(givenPlain, wantPlain) <= writeTolerance(wantPlain)) return { kind: 'typo' };
  return { kind: 'wrong' };
}

export function isWriteCorrect(verdict: WriteVerdict): boolean {
  return verdict.kind !== 'wrong';
}

/** Message shown for a correct answer that was not perfect, or null when it was. */
export function writeNote(verdict: WriteVerdict, target: string): string | null {
  if (verdict.kind === 'macron') return `Correct, watch the macron: ${target}`;
  if (verdict.kind === 'typo') return `Correct, watch the spelling: ${target}`;
  return null;
}

/** Insert `text` at the selection of an input value; returns the new value and cursor. */
export function insertAtCursor(
  value: string,
  selectionStart: number | null,
  selectionEnd: number | null,
  text: string,
): { value: string; cursor: number } {
  const start = selectionStart ?? value.length;
  const end = selectionEnd ?? start;
  return { value: value.slice(0, start) + text + value.slice(end), cursor: start + text.length };
}
