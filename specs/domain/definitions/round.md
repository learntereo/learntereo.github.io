# Round

**Context:** Learning

A 10-question session in one [Level](level.md) and one [Mode](mode.md), stored in the `rounds` table.

## Lifecycle

| Status | Meaning |
|--------|---------|
| `in_progress` | Resumable; at most one per learner (unique partial index) |
| `completed` | Finished; contributes to history |
| `abandoned` | Replaced by a new round or discarded because its saved state was invalid |

## Rules

- Up to 7 of the 10 questions are built around items not yet learned; the rest review learned items.
- Missed questions are re-queued once at the end. Re-queued attempts earn no XP but count toward item mastery when correct.
- Score is `correct / 10` over the original questions; first try and retry both count.
- XP: +10 first try, +5 retry, 0 missed or re-queued, +20 on completion.
- The full state (questions, index, outcomes, re-queue) is saved after every answered question and validated before resuming.

Code: `src/game/roundGenerator.ts`, `src/game/roundState.ts`, `src/game/xp.ts`, `src/data/roundRepo.ts`, `src/ui/screens/RoundScreen.tsx`.
