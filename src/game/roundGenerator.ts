import type { Item, Level, Mode, Question, QuestionMode, SentenceItem, WordItem } from './types';
import { pickDecoys } from './orderCheck';
import { shuffle, type Rng } from './rng';

export const ROUND_SIZE = 10;
/** At most this many of the 10 questions are built around not-yet-learned items. */
export const MAX_NEW_QUESTIONS = 7;
export const MATCH_BOARD_SIZE = 5;
export const PICTURE_BOARD_SIZE = 4;

interface Pools {
  words: WordItem[];
  imageWords: WordItem[];
  sentences: SentenceItem[];
}

function buildPools(items: readonly Item[], level: Level): Pools {
  const levelItems = items.filter((i) => i.level === level);
  const words = levelItems.filter((i): i is WordItem => i.kind === 'word');
  const sentences = levelItems.filter((i): i is SentenceItem => i.kind === 'sentence');
  return { words, imageWords: words.filter((w) => w.image !== undefined), sentences };
}

/** Question modes that have enough content at this level. */
export function eligibleModes(items: readonly Item[], level: Level): QuestionMode[] {
  const pools = buildPools(items, level);
  const modes: QuestionMode[] = [];
  if (pools.words.length >= MATCH_BOARD_SIZE) modes.push('match');
  if (pools.words.length + pools.sentences.length > 0) modes.push('translate');
  if (pools.sentences.length > 0) modes.push('order');
  if (pools.imageWords.length >= PICTURE_BOARD_SIZE) modes.push('picture');
  return modes;
}

function poolFor(mode: QuestionMode, pools: Pools): readonly Item[] {
  switch (mode) {
    case 'match':
      return pools.words;
    case 'picture':
      return pools.imageWords;
    case 'order':
      return pools.sentences;
    case 'translate':
      return [...pools.words, ...pools.sentences];
  }
}

function slotModes(mode: Mode, eligible: readonly QuestionMode[], size: number, rng: Rng): QuestionMode[] {
  if (mode !== 'mixed') {
    if (!eligible.includes(mode)) throw new Error(`Not enough content for ${mode} mode`);
    return Array.from({ length: size }, () => mode);
  }
  if (eligible.length === 0) throw new Error('No content available');
  const modes = Array.from({ length: size }, () => eligible[Math.floor(rng() * eligible.length)]);
  // A "mixed" round should really mix: if chance gave one mode, swap the last slot.
  if (eligible.length > 1 && new Set(modes).size === 1) {
    modes[size - 1] = eligible.find((m) => m !== modes[0]) as QuestionMode;
  }
  return modes;
}

/**
 * Build the 10 questions for a round.
 *
 * - Up to 7 questions are built around an unlearned item (their "primary"
 *   item); the remaining slots prefer already learned items for review. If a
 *   preferred kind runs out, the other kind fills in.
 * - Items are not reused within a round while unused ones remain. A level with
 *   fewer words than a full set of boards needs (for example 10 Match boards
 *   of 5 words from 40 intermediate words) reuses the least-used words.
 * - Mixed picks a random eligible mode per question.
 */
export interface GenerateOptions {
  /** Number of questions (default 10). */
  size?: number;
  /** How many questions prefer unlearned items (default 7, or all if the round is shorter). */
  maxNew?: number;
  /** Ignore what is learned and spread questions evenly over the items (unit check). */
  neutral?: boolean;
}

export function generateRound(
  items: readonly Item[],
  level: Level,
  mode: Mode,
  learned: ReadonlySet<string>,
  rng: Rng,
  options: GenerateOptions = {},
): Question[] {
  const size = options.size ?? ROUND_SIZE;
  const maxNew = options.maxNew ?? Math.min(MAX_NEW_QUESTIONS, size);
  const pools = buildPools(items, level);
  const eligible = eligibleModes(items, level);
  const modes = slotModes(mode, eligible, size, rng);

  const newSlots = new Set(shuffle(Array.from({ length: size }, (_, i) => i), rng).slice(0, maxNew));
  const usage = new Map<string, number>();
  const primaries = new Set<string>();

  function choose(pool: readonly Item[], count: number, wantNew: boolean, exclude: ReadonlySet<string>): Item[] {
    const candidates = shuffle(pool, rng).filter((item) => !exclude.has(item.id));
    const rank = (item: Item) => {
      const isNew = !learned.has(item.id);
      return (usage.get(item.id) ?? 0) * 2 + (options.neutral || isNew === wantNew ? 0 : 1);
    };
    // Stable sort keeps the shuffled order among equal ranks.
    return candidates.sort((a, b) => rank(a) - rank(b)).slice(0, count);
  }

  const questions: Question[] = [];
  for (let slot = 0; slot < size; slot++) {
    const questionMode = modes[slot];
    const wantNew = newSlots.has(slot);
    const pool = poolFor(questionMode, pools);
    const size = questionMode === 'match' ? MATCH_BOARD_SIZE : questionMode === 'picture' ? PICTURE_BOARD_SIZE : 1;
    // The primary item is never a previous primary; the rest of a board avoids it.
    // Small pools (a single unit's sentences) can run out of fresh primaries; then reuse the least-used.
    const [primary] = choose(pool, 1, wantNew, primaries).concat(choose(pool, 1, wantNew, new Set()));
    primaries.add(primary.id);
    const chosen = [primary, ...choose(pool, size - 1, wantNew, new Set([primary.id]))];
    for (const item of chosen) usage.set(item.id, (usage.get(item.id) ?? 0) + 1);

    const question: Question = { mode: questionMode, itemIds: chosen.map((c) => c.id), requeued: false };
    if (questionMode === 'order') {
      question.decoys = pickDecoys(chosen[0] as SentenceItem, pools.sentences, rng);
    }
    questions.push(question);
  }
  return questions;
}
