# Level

**Context:** Learning

A difficulty tier. Every [Item](item.md) and every [Round](round.md) belongs to exactly one level.

| Level | Units | Availability |
|-------|-------|--------------|
| Beginner | 8 | Always open |
| Intermediate | 8 | Opens when every Beginner [Unit](unit.md) is complete |
| Advanced | 6 | Opens when every Intermediate unit is complete |

## Rules

- A level is **complete** when all of its units are complete.
- Item ids carry the level: `w-b-001` (Beginner), `s-i-004` (Intermediate), `w-a-001` (Advanced).
- The PoC flag `profiles.beginner_completed_at` is still read: it marks every Beginner unit complete. It is no longer written.

Code: `src/game/unitUnlock.ts`.
