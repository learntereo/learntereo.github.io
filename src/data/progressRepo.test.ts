import { describe, expect, it } from 'vitest';
import { mergeAttempts, type ItemProgressRow } from './progressRepo';

const NOW = '2026-10-09T10:00:00.000Z';
const EARLIER = '2026-10-01T10:00:00.000Z';
const SRS = { ease: 2.5, interval_days: 1, due_on: null, lapses: 0 };

describe('mergeAttempts', () => {
  it('creates rows for new items', () => {
    const rows = mergeAttempts('u1', new Map(), [{ itemId: 'a', correct: true }, { itemId: 'b', correct: false }], NOW);
    expect(rows).toEqual([
      { user_id: 'u1', item_id: 'a', attempt_count: 1, correct_count: 1, first_correct_at: NOW, last_seen_at: NOW, ...SRS },
      { user_id: 'u1', item_id: 'b', attempt_count: 1, correct_count: 0, first_correct_at: null, last_seen_at: NOW, ...SRS },
    ]);
  });

  it('adds to existing counts and keeps the original first_correct_at', () => {
    const existing = new Map<string, ItemProgressRow>([
      ['a', { user_id: 'u1', item_id: 'a', attempt_count: 3, correct_count: 2, first_correct_at: EARLIER, last_seen_at: EARLIER, ...SRS }],
    ]);
    const [row] = mergeAttempts('u1', existing, [{ itemId: 'a', correct: true }], NOW);
    expect(row).toMatchObject({ attempt_count: 4, correct_count: 3, first_correct_at: EARLIER, last_seen_at: NOW });
  });

  it('sets first_correct_at when an unlearned item is finally answered', () => {
    const existing = new Map<string, ItemProgressRow>([
      ['a', { user_id: 'u1', item_id: 'a', attempt_count: 1, correct_count: 0, first_correct_at: null, last_seen_at: EARLIER, ...SRS }],
    ]);
    const [row] = mergeAttempts('u1', existing, [{ itemId: 'a', correct: true }], NOW);
    expect(row.first_correct_at).toBe(NOW);
  });

  it('combines several attempts at the same item in one round (e.g. after a re-queue)', () => {
    const rows = mergeAttempts('u1', new Map(), [{ itemId: 'a', correct: false }, { itemId: 'a', correct: true }], NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ attempt_count: 2, correct_count: 1, first_correct_at: NOW });
  });
});
