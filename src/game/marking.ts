import { levenshtein } from './levenshtein';

const LEADING_WORDS = new Set(['a', 'an', 'the', 'to']);

/**
 * Lowercase, NFC, strip punctuation, collapse whitespace and drop leading
 * "a / an / the / to" so "The Dog!" and "dog" compare equal.
 */
export function normaliseAnswer(input: string): string {
  const cleaned = input
    .normalize('NFC')
    .toLowerCase()
    .replace(/['‘’`"“”]/g, '')
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned === '') return '';
  const parts = cleaned.split(' ');
  while (parts.length > 1 && LEADING_WORDS.has(parts[0])) parts.shift();
  return parts.join(' ');
}

/** Maximum edit distance allowed for a normalised accepted answer. */
export function typoTolerance(normalisedAccepted: string): number {
  return normalisedAccepted.length <= 8 ? 1 : 2;
}

export function isAnswerCorrect(input: string, accepted: readonly string[]): boolean {
  const normalisedInput = normaliseAnswer(input);
  if (normalisedInput === '') return false;
  return accepted.some((answer) => {
    const target = normaliseAnswer(answer);
    if (target === '') return false;
    if (normalisedInput === target) return true;
    // Numerals are exact: "2" must never pass for "1".
    if (/\d/.test(target) || /\d/.test(normalisedInput)) return false;
    return levenshtein(normalisedInput, target) <= typoTolerance(target);
  });
}
