# Question

**Context:** Learning

One exercise within a [Round](round.md). A question may cover several [Items](item.md): a Match board covers 5 words and a Picture board 4.

## Attributes

| Attribute | Notes |
|-----------|-------|
| `mode` | `match`, `picture`, `translate` or `order` (never `mixed`) |
| `itemIds` | The items covered; the first is the primary item used for prioritisation |
| `decoys` | Order only: the decoy tiles chosen when the round was generated |
| `requeued` | True for the second, final attempt at a missed question |

## Result

| Result | Meaning | XP |
|--------|---------|----|
| First try | Correct with no wrong attempt or drop | 10 |
| Retry | Correct after a wrong attempt, with no answer shown | 5 |
| Missed | The answer was shown | 0 |

Boards: first try if no wrong drops, retry if wrong drops but no reveal, missed if any word was revealed. Each word updates item progress individually.

Code: `src/game/types.ts`, `src/game/boardResult.ts`.
