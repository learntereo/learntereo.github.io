# Mode

**Context:** Learning

The exercise style of a [Round](round.md).

| Mode | Question shape | Items used |
|------|----------------|------------|
| Match | Board of 5 pairs: drag Māori words onto English meanings | Words |
| Picture | Board of 4 pairs: drag Māori words onto pictures | Words with an image |
| Translate | Type the English for a Māori word or sentence | Words and sentences |
| Write | Type the Māori for an English word or short sentence, with a macron key row | Words and sentences of up to 6 tiles |
| Fill the gap | Drag or tap the missing word of a Māori sentence | Sentences |
| Order | Drag Māori tiles, plus decoys, into the right order | Sentences |
| Mixed | A random eligible mode per question | Any |

Path rounds (unit practice, unit check and Review) are stored as their own round modes and draw on all of these.

## Rules

- A wrong answer allows one retry; after a second wrong answer the correct answer is shown and the question counts as missed.
- Boards bounce a wrong drop back, and reveal the right target after 2 wrong drops of one word (not in a unit check).
- Translate marking is lenient: case, punctuation, whitespace and leading articles are ignored, any accepted answer counts, and small typos are tolerated (distance 1 up to 8 characters, 2 above).
- Order accepts `tiles` or any `altOrders`; decoys count 1 for Beginner and 2 for Intermediate and Advanced.
- Write accepts a missing or extra macron (with a "watch the macron" note) and counts it as first try. Typos are forgiven only in answers longer than 4 letters.
- Fill the gap offers the answer and 3 distractors, taken from the same word group when it is a small grammar word. It never offers two words that would both be right.
- Every drag interaction is also operable by tap and by keyboard.

Code: `src/game/macronMarking.ts`, `src/game/gapGenerator.ts`, `src/game/marking.ts`, `src/game/orderCheck.ts`, `src/game/boardResult.ts`, `src/ui/modes/`.
