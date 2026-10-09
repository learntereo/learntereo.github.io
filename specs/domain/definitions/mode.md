# Mode

**Context:** Learning

The exercise style of a [Round](round.md).

| Mode | Question shape | Items used |
|------|----------------|------------|
| Match | Board of 5 pairs: drag Māori words onto English meanings | Words |
| Picture | Board of 4 pairs: drag Māori words onto pictures | Words with an image |
| Translate | Type the English for a Māori word or sentence (Māori to English only) | Words and sentences |
| Order | Drag Māori tiles, plus decoys, into the right order | Sentences |
| Mixed | A random eligible mode per question | Any |

## Rules

- A wrong answer allows one retry; after a second wrong answer the correct answer is shown and the question counts as missed.
- Boards bounce a wrong drop back, and reveal the right target after 2 wrong drops of one word.
- Translate marking is lenient: case, punctuation, whitespace and leading articles are ignored, any accepted answer counts, and small typos are tolerated (distance 1 up to 8 characters, 2 above).
- Order accepts `tiles` or any `altOrders`; decoys count 1 for Beginner and 2 for Intermediate.
- Every drag interaction is also operable by tap and by keyboard.

Code: `src/game/marking.ts`, `src/game/orderCheck.ts`, `src/game/boardResult.ts`, `src/ui/modes/`.
