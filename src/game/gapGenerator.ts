import { shuffle, type Rng } from './rng';
import type { SentenceItem } from './types';

export const GAP_OPTIONS = 4;

/**
 * Small words that do grammatical work. A blanked particle gets distractors
 * from its own group, so the learner has to know the pattern, not just spot
 * the odd word out.
 */
/** Possessives by person and number. A and O forms are different words; the neutral form fits either. */
const POSSESSIVES: readonly { a: string; o: string; neutral: string }[] = [
  { a: 'tāku', o: 'tōku', neutral: 'taku' },
  { a: 'āku', o: 'ōku', neutral: 'aku' },
  { a: 'tāu', o: 'tōu', neutral: 'tō' },
  { a: 'āu', o: 'ōu', neutral: 'ō' },
  { a: 'tāna', o: 'tōna', neutral: 'tana' },
  { a: 'āna', o: 'ōna', neutral: 'ana' },
];

const GROUPS: readonly (readonly string[])[] = [
  ['te', 'ngā', 'he', 'ko'],
  ['kei', 'i', 'ka', 'e', 'ana'],
  ['tēnei', 'tēnā', 'tērā'],
  ['ki'],
  ['ahau', 'koe', 'ia', 'mātou', 'tātou', 'rātou', 'koutou', 'kōrua'],
  POSSESSIVES.flatMap((p) => [p.a, p.o, p.neutral]),
];

const PARTICLES = new Set(GROUPS.flat());

/**
 * Pairs where either word would be right in the same sentence with the same
 * English: both mean "that", both mean "we", and both mark where something is
 * going or acted on.
 */
const SYNONYMS: readonly (readonly [string, string])[] = [
  ['tēnā', 'tērā'],
  ['mātou', 'tātou'],
  ['ki', 'i'],
];

/**
 * True when two words could both be correct in the same gap. The neutral
 * possessive (taku, tō, tana and plurals) fits wherever the A or O form does,
 * so it clashes with both. A against O (tāku and tōku) is a real choice.
 */
export function interchangeable(a: string, b: string): boolean {
  if (a === b) return true;
  if (SYNONYMS.some(([x, y]) => (a === x && b === y) || (a === y && b === x))) return true;
  return POSSESSIVES.some((p) => {
    const forms = [p.a, p.o, p.neutral];
    return forms.includes(a) && forms.includes(b) && (a === p.neutral || b === p.neutral);
  });
}

function ambiguous(answer: string, candidate: string): boolean {
  return interchangeable(answer, candidate);
}

export interface Gap {
  /** Index in `sentence.tiles` of the blanked tile. */
  gapIndex: number;
  /** The answer and its distractors, shuffled. */
  options: string[];
}

/**
 * Blank one tile of a sentence and pick distractors: same group first for
 * particles, other content words for content words, then anything from the
 * same level's sentences. Distractors never repeat a tile of the sentence.
 */
export function buildGap(sentence: SentenceItem, sameLevelSentences: readonly SentenceItem[], rng: Rng): Gap {
  const gapIndex = Math.floor(rng() * sentence.tiles.length);
  const answer = sentence.tiles[gapIndex];
  const taken = new Set([...sentence.tiles]);
  const usable = (candidate: string) => !taken.has(candidate) && !ambiguous(answer, candidate);

  const distractors: string[] = [];
  const add = (candidates: readonly string[]) => {
    for (const candidate of shuffle([...new Set(candidates)], rng)) {
      if (distractors.length >= GAP_OPTIONS - 1) return;
      if (usable(candidate) && !distractors.includes(candidate)) distractors.push(candidate);
    }
  };

  const levelTiles = sameLevelSentences.flatMap((s) => [...s.tiles, ...(s.decoys ?? [])]);
  const group = GROUPS.filter((g) => g.includes(answer)).flat();
  if (PARTICLES.has(answer)) {
    add(group);
    add(levelTiles.filter((t) => PARTICLES.has(t)));
  } else {
    add(levelTiles.filter((t) => !PARTICLES.has(t)));
  }
  add(levelTiles);

  return { gapIndex, options: shuffle([answer, ...distractors], rng) };
}
