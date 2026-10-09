import type { Item, Level, SentenceItem, WordItem } from '../types';

const EMOJI = ['🐕', '🐈', '🐦', '🐟', '🐖', '🐄', '🐎', '🐔', '☀️', '🌙', '⭐', '🌧️'];

/** Small deterministic content set for tests: independent of the real content.json. */
export function makeWord(index: number, level: Level = 'beginner', withImage = true): WordItem {
  const prefix = level === 'beginner' ? 'b' : 'i';
  const n = String(index).padStart(3, '0');
  const word: WordItem = {
    id: `w-${prefix}-${n}`,
    kind: 'word',
    level,
    mi: `kupu${index}`,
    en: [`word${index}`],
  };
  if (withImage) word.image = { emoji: EMOJI[index % EMOJI.length] };
  return word;
}

export function makeSentence(index: number, level: Level = 'beginner', decoys?: string[]): SentenceItem {
  const prefix = level === 'beginner' ? 'b' : 'i';
  const n = String(index).padStart(3, '0');
  const tiles = [`he${index}`, 'te', `kupu${index}`];
  const sentence: SentenceItem = {
    id: `s-${prefix}-${n}`,
    kind: 'sentence',
    level,
    mi: tiles.join(' '),
    en: [`sentence ${index}`],
    tiles,
  };
  if (decoys) sentence.decoys = decoys;
  return sentence;
}

/** 20 words (first 12 with images) + 10 sentences, per level. */
export function makeItems(): Item[] {
  const items: Item[] = [];
  for (const level of ['beginner', 'intermediate'] as const) {
    for (let i = 1; i <= 20; i++) items.push(makeWord(i, level, i <= 12));
    for (let i = 1; i <= 10; i++) items.push(makeSentence(i, level, i % 2 === 0 ? undefined : [`dx${i}`, `dy${i}`]));
  }
  return items;
}
