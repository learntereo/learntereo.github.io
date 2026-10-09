import { buildGap } from './gapGenerator';
import { pickDecoys } from './orderCheck';
import { shuffle, type Rng } from './rng';
import { MATCH_BOARD_SIZE, WRITE_MAX_TILES } from './roundGenerator';
import type { Item, Question, QuestionMode, SentenceItem, WordItem } from './types';

function pick<T>(options: readonly T[], rng: Rng): T {
  return options[Math.floor(rng() * options.length)];
}

/**
 * Review questions for the due items, given most overdue first. Five or more
 * due words become one Match board (each word is still scheduled on its own);
 * every other item gets its own question in a mode that suits it.
 * `allItems` supplies decoy and distractor material for Order and Fill the gap.
 */
export function generateReview(due: readonly Item[], allItems: readonly Item[], rng: Rng): Question[] {
  const words = due.filter((i): i is WordItem => i.kind === 'word');
  const questions: Question[] = [];
  let singles: Item[] = [...due];

  if (words.length >= MATCH_BOARD_SIZE) {
    const board = words.slice(0, MATCH_BOARD_SIZE);
    questions.push({ mode: 'match', itemIds: board.map((w) => w.id), requeued: false });
    const used = new Set(board.map((w) => w.id));
    singles = singles.filter((i) => !used.has(i.id));
  }

  for (const item of singles) {
    if (item.kind === 'word') {
      const mode: QuestionMode = pick(['translate', 'write'] as const, rng);
      questions.push({ mode, itemIds: [item.id], requeued: false });
      continue;
    }
    const modes: QuestionMode[] = ['translate', 'order', 'gap'];
    if (item.tiles.length <= WRITE_MAX_TILES) modes.push('write');
    const mode = pick(modes, rng);
    const sameLevel = allItems.filter((i): i is SentenceItem => i.kind === 'sentence' && i.level === item.level);
    const question: Question = { mode, itemIds: [item.id], requeued: false };
    if (mode === 'order') question.decoys = pickDecoys(item, sameLevel, rng);
    if (mode === 'gap') {
      const gap = buildGap(item, sameLevel, rng);
      question.gapIndex = gap.gapIndex;
      question.options = gap.options;
    }
    questions.push(question);
  }
  return shuffle(questions, rng);
}
