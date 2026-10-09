import type { Item, Level, Mode, Outcome, Question, QuestionMode, Result, RoundState } from './types';
import { LEVELS, MODES } from './types';
import { roundScore } from './xp';

export function createRound(level: Level, mode: Mode, questions: Question[]): RoundState {
  return {
    version: 1,
    level,
    mode,
    originalCount: questions.length,
    questions,
    index: 0,
    outcomes: [],
    requeued: false,
  };
}

export function currentQuestion(state: RoundState): Question | undefined {
  return state.questions[state.index];
}

export function isRoundComplete(state: RoundState): boolean {
  return state.index >= state.questions.length;
}

/** True while the learner is replaying missed questions. */
export function isReviewPhase(state: RoundState): boolean {
  return state.index >= state.originalCount;
}

/**
 * Record the outcome of the current question and advance. When the last
 * original question is answered, every missed original question is appended
 * once more (flagged `requeued`); a re-queued question is never queued again.
 */
export function recordAnswer(state: RoundState, outcome: Outcome): RoundState {
  const question = currentQuestion(state);
  if (!question) return state;

  const outcomes = [...state.outcomes, { ...outcome, requeued: question.requeued }];
  const index = state.index + 1;
  let questions = state.questions;
  let requeued = state.requeued;

  if (!requeued && index === state.originalCount) {
    const retries = state.questions
      .slice(0, state.originalCount)
      .filter((_, i) => outcomes[i].result === 'missed')
      .map((q): Question => ({ ...q, requeued: true }));
    questions = [...state.questions, ...retries];
    requeued = true;
  }

  return { ...state, questions, index, outcomes, requeued };
}

/** Score over the original questions (first try or retry both count). */
export function scoreOf(state: RoundState): number {
  return roundScore(state.outcomes);
}

export interface QuestionProgress {
  /** 1-based position shown in the progress bar, capped at the original count. */
  position: number;
  total: number;
  review: boolean;
  /** Position within the review phase (1-based), when reviewing. */
  reviewPosition: number;
  reviewTotal: number;
}

export function progressOf(state: RoundState): QuestionProgress {
  const review = isReviewPhase(state);
  return {
    position: Math.min(state.index + 1, state.originalCount),
    total: state.originalCount,
    review,
    reviewPosition: review ? state.index - state.originalCount + 1 : 0,
    reviewTotal: state.questions.length - state.originalCount,
  };
}

/** JSON-safe copy for storage in the `rounds.state` jsonb column. */
export function serialiseRound(state: RoundState): RoundState {
  return JSON.parse(JSON.stringify(state)) as RoundState;
}

// ---------------------------------------------------------------------------
// Validation (resume safety)
// ---------------------------------------------------------------------------

const QUESTION_MODES: readonly QuestionMode[] = ['match', 'translate', 'order', 'picture'];
const RESULTS: readonly Result[] = ['first', 'retry', 'missed'];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((s) => typeof s === 'string');
}

function validQuestion(q: unknown, itemsById: ReadonlyMap<string, Item>, level: Level): q is Question {
  if (!isRecord(q)) return false;
  if (!QUESTION_MODES.includes(q.mode as QuestionMode)) return false;
  if (typeof q.requeued !== 'boolean') return false;
  if (!isStringArray(q.itemIds) || q.itemIds.length === 0) return false;

  const items = q.itemIds.map((id) => itemsById.get(id));
  if (items.some((item) => item === undefined || item.level !== level)) return false;
  if (new Set(q.itemIds).size !== q.itemIds.length) return false;

  switch (q.mode) {
    case 'match':
      return q.itemIds.length === 5 && items.every((i) => i?.kind === 'word');
    case 'picture':
      return q.itemIds.length === 4 && items.every((i) => i?.kind === 'word' && i.image !== undefined);
    case 'order':
      return q.itemIds.length === 1 && items[0]?.kind === 'sentence' && isStringArray(q.decoys);
    case 'translate':
      return q.itemIds.length === 1;
  }
  return false;
}

function validOutcome(o: unknown): o is Outcome {
  if (!isRecord(o)) return false;
  if (!RESULTS.includes(o.result as Result)) return false;
  if (typeof o.requeued !== 'boolean') return false;
  return (
    Array.isArray(o.items) &&
    o.items.every((i) => isRecord(i) && typeof i.itemId === 'string' && typeof i.correct === 'boolean')
  );
}

/**
 * Returns the state if it is structurally valid and every referenced item
 * still exists in the current content; otherwise null (the caller discards
 * the round and starts fresh).
 */
export function validateRoundState(raw: unknown, itemsById: ReadonlyMap<string, Item>): RoundState | null {
  if (!isRecord(raw)) return null;
  if (raw.version !== 1) return null;
  if (!LEVELS.includes(raw.level as Level)) return null;
  if (!MODES.includes(raw.mode as Mode)) return null;
  if (typeof raw.requeued !== 'boolean') return null;
  if (!Number.isInteger(raw.originalCount) || (raw.originalCount as number) < 1) return null;
  if (!Array.isArray(raw.questions) || !Array.isArray(raw.outcomes)) return null;
  if (!Number.isInteger(raw.index)) return null;

  const level = raw.level as Level;
  const originalCount = raw.originalCount as number;
  const index = raw.index as number;

  if (raw.questions.length < originalCount) return null;
  if (!raw.questions.every((q) => validQuestion(q, itemsById, level))) return null;
  if (!raw.outcomes.every(validOutcome)) return null;
  if (index < 0 || index > raw.questions.length) return null;
  if (raw.outcomes.length !== index) return null;
  if (raw.requeued && index < originalCount) return null;
  if (!raw.requeued && raw.questions.length !== originalCount) return null;
  if (!raw.requeued && index >= originalCount) return null;

  return raw as unknown as RoundState;
}
