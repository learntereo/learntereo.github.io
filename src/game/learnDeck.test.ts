import { describe, expect, it } from 'vitest';
import { grammarFor, sentencesForUnit, units, wordsForUnit } from '../content/content';
import { buildLearnCards, exampleFor } from './learnDeck';
import type { SentenceItem, WordItem } from './types';

const sentence = (id: string, mi: string): SentenceItem => ({
  id,
  kind: 'sentence',
  level: 'beginner',
  mi,
  en: ['x'],
  tiles: mi.toLowerCase().split(' '),
});
const word = (id: string, mi: string): WordItem => ({ id, kind: 'word', level: 'beginner', mi, en: ['x'] });

describe('exampleFor', () => {
  it('finds a sentence that contains the word', () => {
    const s = sentence('s1', 'He kurī tēnā');
    expect(exampleFor(word('w1', 'kurī'), [s])?.id).toBe('s1');
  });

  it('matches whole words only', () => {
    expect(exampleFor(word('w1', 'kai'), [sentence('s1', 'Kei te kaimoana ahau')])).toBeUndefined();
  });

  it('is case-insensitive', () => {
    expect(exampleFor(word('w1', 'kei'), [sentence('s1', 'Kei hea te pahi')])?.id).toBe('s1');
  });

  it('is macron-sensitive, so ua does not match uā', () => {
    expect(exampleFor(word('w1', 'tē'), [sentence('s1', 'Tēnā koe')])).toBeUndefined();
  });

  it('matches multi-word items as a phrase', () => {
    expect(exampleFor(word('w1', 'kia ora'), [sentence('s1', 'Kia ora koutou')])?.id).toBe('s1');
    expect(exampleFor(word('w2', 'ora kia'), [sentence('s1', 'Kia ora koutou')])).toBeUndefined();
  });

  it('prefers the shortest sentence', () => {
    const long = sentence('long', 'Kei te haere ahau ki te kura');
    const short = sentence('short', 'Haere mai');
    expect(exampleFor(word('w1', 'haere'), [long, short])?.id).toBe('short');
  });

  it('returns undefined when no sentence uses the word', () => {
    expect(exampleFor(word('w1', 'pūkeko'), [sentence('s1', 'He kurī tēnā')])).toBeUndefined();
  });
});

describe('buildLearnCards', () => {
  const w1 = word('w1', 'kurī');
  const w2 = word('w2', 'ngeru');
  const s1 = sentence('s1', 'He kurī tēnā');

  it('lists a card per word, then the grammar note, then a finish card', () => {
    const cards = buildLearnCards([w1, w2, s1], '## Note\n\ntext');
    expect(cards.map((c) => c.kind)).toEqual(['word', 'word', 'grammar', 'done']);
    expect(cards[0]).toMatchObject({ kind: 'word', word: w1, example: s1 });
    expect(cards[1]).toMatchObject({ kind: 'word', word: w2 });
    expect(cards[2]).toMatchObject({ kind: 'grammar', markdown: '## Note\n\ntext' });
  });

  it('skips the grammar card when there is no note', () => {
    expect(buildLearnCards([w1, s1], undefined).map((c) => c.kind)).toEqual(['word', 'done']);
  });
});

describe('real units', () => {
  it('give every unit a card for each word, a grammar card and a finish card', () => {
    for (const unit of units) {
      const cards = buildLearnCards([...wordsForUnit(unit), ...sentencesForUnit(unit)], grammarFor(unit));
      expect(cards.filter((c) => c.kind === 'word')).toHaveLength(wordsForUnit(unit).length);
      expect(cards.at(-1)?.kind).toBe('done');
      expect(cards.at(-2)?.kind).toBe('grammar');
    }
  });

  it('finds an example sentence for most words', () => {
    let withExample = 0;
    let total = 0;
    for (const unit of units) {
      const sentences = sentencesForUnit(unit);
      for (const w of wordsForUnit(unit)) {
        total++;
        if (exampleFor(w, sentences)) withExample++;
      }
    }
    expect(withExample / total).toBeGreaterThan(0.4);
  });
});
