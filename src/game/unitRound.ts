import { generateRound } from './roundGenerator';
import type { Rng } from './rng';
import type { Item, Question, RoundState, Unit } from './types';

export const PRACTICE_SIZE = 10;
export const CHECK_SIZE = 12;
/** The unit check is passed with at least this share of the questions right. */
export const PASS_PERCENT = 80;

/** Smallest score that passes a round of `total` questions (10 of 12). */
export function passMark(total: number): number {
  return Math.ceil((total * PASS_PERCENT) / 100);
}

export function isPass(score: number, total: number): boolean {
  return total > 0 && score >= passMark(total);
}

function itemsOf(unit: Unit, items: readonly Item[]): Item[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  return unit.itemIds.map((id) => byId.get(id)).filter((i): i is Item => i !== undefined);
}

/**
 * Practice: 10 questions of every mode the unit supports, drawn only from the
 * unit's own items. Revisiting older words is the job of the Review tab.
 */
export function generateUnitPractice(unit: Unit, items: readonly Item[], learned: ReadonlySet<string>, rng: Rng): Question[] {
  return generateRound(itemsOf(unit, items), unit.level, 'mixed', learned, rng, { size: PRACTICE_SIZE, maxNew: PRACTICE_SIZE });
}

/**
 * Unit check: 12 mixed questions from the unit's own items only. What the
 * learner already knows does not change the questions.
 */
export function generateUnitCheck(unit: Unit, items: readonly Item[], rng: Rng): Question[] {
  return generateRound(itemsOf(unit, items), unit.level, 'mixed', new Set(), rng, {
    size: CHECK_SIZE,
    neutral: true,
  });
}

/** Distinct items answered wrong in the original questions (re-queued answers are ignored). */
export function missedItemIds(state: Pick<RoundState, 'outcomes'>): string[] {
  const missed: string[] = [];
  for (const outcome of state.outcomes) {
    if (outcome.requeued) continue;
    for (const item of outcome.items) {
      if (!item.correct && !missed.includes(item.itemId)) missed.push(item.itemId);
    }
  }
  return missed;
}
