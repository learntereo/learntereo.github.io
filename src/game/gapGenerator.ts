import { shuffle, type Rng } from './rng';
import type { SentenceItem } from './types';

export const GAP_OPTIONS = 4;

/**
 * Small words that do grammatical work. A blanked particle gets distractors
 * from its own group, so the learner has to know the pattern, not just spot
 * the odd word out.
 */
const GROUPS: readonly (readonly string[])[] = [
  ['te', 'ngā', 'he', 'ko'],
  ['kei', 'i', 'ka', 'e', 'ana'],
  ['tēnei', 'tēnā', 'tērā'],
  ['ki', 'i', 'kei'],
  ['ahau', 'koe', 'ia', 'mātou', 'tātou', 'rātou', 'koutou', 'kōrua'],
  ['tōku', 'taku', 'tō', 'tōna', 'tāna', 'ōku', 'āku', 'ō', 'ā'],
];

const PARTICLES = new Set(GROUPS.flat());

/** These two both mean "that", so either would be right for the same English. */
const SYNONYMS: readonly (readonly [string, string])[] = [['tēnā', 'tērā']];

function ambiguous(answer: string, candidate: string): boolean {
  return SYNONYMS.some(([a, b]) => (answer === a && candidate === b) || (answer === b && candidate === a));
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
