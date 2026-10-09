import { describe, expect, it } from 'vitest';
import { makeItems } from './__fixtures__/items';
import { generateRound } from './roundGenerator';
import { createRng } from './rng';
import {
  createRound,
  currentQuestion,
  isReviewPhase,
  isRoundComplete,
  progressOf,
  recordAnswer,
  scoreOf,
  serialiseRound,
  validateRoundState,
} from './roundState';
import type { Item, Outcome, Result, RoundState } from './types';

const items = makeItems();
const byId = new Map<string, Item>(items.map((i) => [i.id, i]));

function newRound(seed = 1, mode: 'translate' | 'mixed' | 'match' = 'translate'): RoundState {
  return createRound('beginner', mode, generateRound(items, 'beginner', mode, new Set(), createRng(seed)));
}

function answer(state: RoundState, result: Result): RoundState {
  const q = currentQuestion(state)!;
  const outcome: Outcome = {
    result,
    requeued: q.requeued,
    items: q.itemIds.map((itemId) => ({ itemId, correct: result !== 'missed' })),
  };
  return recordAnswer(state, outcome);
}

function playAll(state: RoundState, results: Result[]): RoundState {
  let s = state;
  for (const r of results) s = answer(s, r);
  return s;
}

describe('createRound / recordAnswer', () => {
  it('starts at the first question', () => {
    const s = newRound();
    expect(s.index).toBe(0);
    expect(s.originalCount).toBe(10);
    expect(s.requeued).toBe(false);
    expect(isRoundComplete(s)).toBe(false);
  });

  it('completes after 10 answers when nothing was missed', () => {
    const s = playAll(newRound(), Array(10).fill('first'));
    expect(isRoundComplete(s)).toBe(true);
    expect(s.questions).toHaveLength(10);
    expect(scoreOf(s)).toBe(10);
  });

  it('does not change the input state (pure)', () => {
    const s = newRound();
    const before = JSON.stringify(s);
    answer(s, 'first');
    expect(JSON.stringify(s)).toBe(before);
  });

  it('re-queues missed questions once at the end (AC9)', () => {
    const results: Result[] = ['first', 'missed', 'first', 'retry', 'missed', 'first', 'first', 'first', 'first', 'first'];
    const s = playAll(newRound(), results);
    expect(s.questions).toHaveLength(12);
    expect(isRoundComplete(s)).toBe(false);
    expect(isReviewPhase(s)).toBe(true);
    expect(s.questions[10]).toEqual({ ...s.questions[1], requeued: true });
    expect(s.questions[11]).toEqual({ ...s.questions[4], requeued: true });
    expect(s.questions.slice(0, 10).every((q) => !q.requeued)).toBe(true);
  });

  it('never re-queues a re-queued question again', () => {
    const results: Result[] = [...Array(9).fill('first'), 'missed'];
    let s = playAll(newRound(), results);
    expect(s.questions).toHaveLength(11);
    s = answer(s, 'missed');
    expect(s.questions).toHaveLength(11);
    expect(isRoundComplete(s)).toBe(true);
  });

  it('keeps the score based on the original 10 only', () => {
    const results: Result[] = ['first', 'missed', ...Array(8).fill('retry')];
    let s = playAll(newRound(), results);
    expect(scoreOf(s)).toBe(9);
    s = answer(s, 'first'); // re-queued attempt
    expect(scoreOf(s)).toBe(9);
    expect(s.outcomes[10].requeued).toBe(true);
  });

  it('ignores answers once complete', () => {
    const done = playAll(newRound(), Array(10).fill('first'));
    expect(recordAnswer(done, { result: 'first', requeued: false, items: [] })).toBe(done);
  });
});

describe('progressOf', () => {
  it('reports n / 10 and caps during review', () => {
    let s = newRound();
    expect(progressOf(s)).toMatchObject({ position: 1, total: 10, review: false });
    s = playAll(s, ['first', 'first', 'first']);
    expect(progressOf(s).position).toBe(4);
    s = playAll(s, [...Array(6).fill('first'), 'missed']);
    expect(progressOf(s)).toMatchObject({ position: 10, review: true, reviewPosition: 1, reviewTotal: 1 });
  });
});

describe('serialise / resume (AC17)', () => {
  it('round-trips through JSON and validates', () => {
    const s = playAll(newRound(7, 'mixed'), ['first', 'retry', 'missed', 'first']);
    const restored = validateRoundState(JSON.parse(JSON.stringify(serialiseRound(s))), byId);
    expect(restored).toEqual(s);
    expect(restored?.index).toBe(4);
    expect(restored?.outcomes).toHaveLength(4);
  });

  it('resumes mid-review', () => {
    const s = playAll(newRound(), [...Array(9).fill('first'), 'missed']);
    expect(validateRoundState(serialiseRound(s), byId)).toEqual(s);
  });

  it('accepts a completed state', () => {
    const s = playAll(newRound(), Array(10).fill('first'));
    expect(validateRoundState(serialiseRound(s), byId)).toEqual(s);
  });

  it('accepts a fresh Match round', () => {
    const s = newRound(3, 'match');
    expect(validateRoundState(serialiseRound(s), byId)).toEqual(s);
  });
});

describe('validateRoundState rejects invalid state', () => {
  const good = () => serialiseRound(playAll(newRound(), ['first', 'first']));

  it('rejects non-objects and wrong versions', () => {
    expect(validateRoundState(null, byId)).toBeNull();
    expect(validateRoundState('x', byId)).toBeNull();
    expect(validateRoundState([], byId)).toBeNull();
    expect(validateRoundState({ ...good(), version: 2 }, byId)).toBeNull();
  });

  it('rejects unknown item ids (content changed)', () => {
    const s = good();
    s.questions[3] = { ...s.questions[3], itemIds: ['w-b-999'] };
    expect(validateRoundState(s, byId)).toBeNull();
  });

  it('rejects items from the wrong level', () => {
    const s = good();
    s.questions[3] = { ...s.questions[3], itemIds: ['w-i-001'] };
    expect(validateRoundState(s, byId)).toBeNull();
  });

  it('rejects mismatched index and outcomes', () => {
    expect(validateRoundState({ ...good(), index: 5 }, byId)).toBeNull();
    expect(validateRoundState({ ...good(), index: -1 }, byId)).toBeNull();
    expect(validateRoundState({ ...good(), outcomes: [] }, byId)).toBeNull();
  });

  it('rejects bad modes, levels and malformed questions', () => {
    expect(validateRoundState({ ...good(), mode: 'karaoke' }, byId)).toBeNull();
    expect(validateRoundState({ ...good(), level: 'expert' }, byId)).toBeNull();
    const s = good();
    s.questions[0] = { mode: 'match', itemIds: ['w-b-001'], requeued: false };
    expect(validateRoundState(s, byId)).toBeNull();
  });

  it('rejects malformed outcomes', () => {
    const s = good();
    (s.outcomes[0] as unknown as { result: string }).result = 'perfect';
    expect(validateRoundState(s, byId)).toBeNull();
  });

  it('rejects inconsistent re-queue flags', () => {
    const s = good();
    expect(validateRoundState({ ...s, requeued: true }, byId)).toBeNull();
    expect(validateRoundState({ ...s, questions: s.questions.slice(0, 9) }, byId)).toBeNull();
  });
});
