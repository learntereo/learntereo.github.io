# ItemProgress

**Context:** Progress

A [Learner](learner.md)'s attempt and mastery record for one [Item](item.md), stored in `item_progress` with primary key `(user_id, item_id)`.

## Attributes

| Attribute | Notes |
|-----------|-------|
| `attempt_count` | Number of times the item was answered |
| `correct_count` | Number of correct answers |
| `first_correct_at` | When it was first answered correctly; its presence makes the item **learned** |
| `last_seen_at` | Last time the item appeared |

## Rules

- The client merges counts from a completed round and upserts absolute values, so a retried write is safe.
- A learned item stays learned.
- Beginner completion and the "N / 80 items learned" count are derived from `first_correct_at`.

Code: `src/data/progressRepo.ts`, `src/game/unlock.ts`.
