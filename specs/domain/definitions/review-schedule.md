# ReviewSchedule

**Context:** Progress

The spaced-repetition schedule of one [Item](item.md), kept as columns on [ItemProgress](item-progress.md): `ease`, `interval_days`, `due_on` and `lapses`.

| Column | Notes |
|--------|-------|
| `ease` | Starts at 2.5, always between 1.3 and 3.0, rounded to 2 decimals (the database enforces the range) |
| `interval_days` | Days until the next review, at least 1 and at most 365 |
| `due_on` | The learner's local date the item is next due |
| `lapses` | Times the item was missed |

## Rules

A simplified SM-2, applied once per item per answer in a round (re-queued replays are ignored, and each word on a board is scheduled on its own):

- first try: `interval = max(1, round(interval x ease))`, ease +0.1
- retry: interval unchanged, ease -0.15
- missed: interval 1, ease -0.2, lapses +1
- `due_on` = today + interval
- Learned items with no `due_on` (from before Review existed) become due on first load.
- A **Review** round takes up to 15 learned items that are due, most overdue first. "Review (N due)" shows on the Path, and the Review tab shows a count.

Code: `src/game/srs.ts`, `src/game/reviewRound.ts`.
