import type { Item, SentenceItem, WordItem } from './types';

export type LearnCard =
  | { kind: 'word'; word: WordItem; example?: SentenceItem }
  | { kind: 'grammar'; markdown: string }
  | { kind: 'done' };

const tokens = (mi: string): string[] => mi.toLowerCase().split(/\s+/).filter(Boolean);

function containsPhrase(haystack: readonly string[], needle: readonly string[]): boolean {
  if (needle.length === 0) return false;
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((token, j) => haystack[i + j] === token)) return true;
  }
  return false;
}

/** The shortest sentence of the unit that uses this word (whole words, macron-sensitive). */
export function exampleFor(word: WordItem, sentences: readonly SentenceItem[]): SentenceItem | undefined {
  const needle = tokens(word.mi);
  return sentences
    .filter((s) => containsPhrase(tokens(s.mi), needle))
    .sort((a, b) => tokens(a.mi).length - tokens(b.mi).length)[0];
}

/**
 * The Learn deck: one card per new word (with an example), then the grammar
 * note, then a closing card that offers practice. `items` are the unit's items.
 */
export function buildLearnCards(items: readonly Item[], grammarMarkdown: string | undefined): LearnCard[] {
  const sentences = items.filter((i): i is SentenceItem => i.kind === 'sentence');
  const cards: LearnCard[] = items
    .filter((i): i is WordItem => i.kind === 'word')
    .map((word): LearnCard => ({ kind: 'word', word, example: exampleFor(word, sentences) }));
  if (grammarMarkdown) cards.push({ kind: 'grammar', markdown: grammarMarkdown });
  cards.push({ kind: 'done' });
  return cards;
}
