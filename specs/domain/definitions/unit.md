# Unit

**Context:** Learning

One step on the learning path. Each unit has 10-14 words, 5-7 sentences and one grammar note, and belongs to one [Level](level.md). Every [Item](item.md) belongs to exactly one unit.

| Attribute | Notes |
|-----------|-------|
| `id` | For example `b01-greetings` (the first letter is the level: b, i or a) |
| `level`, `order` | Position on the path |
| `title`, `titleMi` | English and Māori titles |
| `itemIds` | The unit's words and sentences |
| `grammar` | Id of the Markdown grammar note |

## Rules

- 22 units: 8 Beginner, 8 Intermediate, 6 Advanced.
- A unit has three steps: **Learn** (a card deck of its words, then the grammar note), **Practice** (10 questions, up to 3 of them revisiting earlier units) and the **unit check** (12 mixed questions, 80% to pass, which is 10 of 12).
- The check never re-queues missed questions, and boards never highlight the right spot.
- Unit 1 of Beginner is open to everyone. A unit opens when the unit before it is complete; the first unit of a level opens when every unit of the previous level is complete.
- A unit is complete when its check was passed, when the learner finished Beginner in the PoC (every Beginner unit), or when every item in it is already learned.
- Free Practice only asks about items in units that are open.
- Unit headers live in `src/content/unitIndex.json` (rebuild with `npm run content:index`). Words, sentences and grammar notes load one level at a time.

Code: `src/content/`, `src/game/unitUnlock.ts`, `src/game/unitRound.ts`, `src/game/learnDeck.ts`.
