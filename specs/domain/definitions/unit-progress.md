# UnitProgress

**Context:** Progress

A [Learner](learner.md)'s record for one [Unit](unit.md), stored in `unit_progress` with primary key `(user_id, unit_id)` and row level security so only the owner can read or write it.

| Attribute | Notes |
|-----------|-------|
| `learned_at` | When the learner reached the end of the Learn deck |
| `completed_at` | When the unit check was first passed; never cleared |
| `best_score` | Highest unit check score (out of 12) |
| `attempts` | Number of unit checks taken |

## Rules

- The unit check is available once Learn is done (or the unit is already complete).
- Every check adds an attempt and keeps the best score. A pass sets `completed_at` once.
- Path state (locked, available, in progress, complete) is derived from these rows plus [ItemProgress](item-progress.md); see [Unit](unit.md).

Code: `src/data/unitProgressRepo.ts`, `src/game/unitUnlock.ts`.
