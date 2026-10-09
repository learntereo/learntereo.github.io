# Level

**Context:** Learning

A difficulty tier. Every [Item](item.md) and every [Round](round.md) belongs to exactly one level.

| Level | Items | Availability |
|-------|-------|--------------|
| Beginner | 60 words, 20 sentences (80 items) | Always playable |
| Intermediate | 40 words, 20 sentences (60 items) | Locked until Beginner is complete |

## Rules

- Beginner is **complete** when every Beginner item has been answered correctly at least once, in any mode.
- Completing Beginner sets `profiles.beginner_completed_at` and shows an unlock celebration on the results screen.
- Advanced is future work.

Code: `src/game/unlock.ts`.
