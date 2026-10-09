# Item

**Context:** Learning

A unit of bundled content, either a **Word** or a **Sentence**. Content lives in `src/content/content.json` and is not stored in the database.

## Attributes

| Attribute | Notes |
|-----------|-------|
| `id` | Stable, for example `w-b-001` (word, beginner) or `s-i-012` (sentence, intermediate) |
| `kind` | `word` or `sentence` |
| `level` | See [Level](level.md) |
| `mi` | Māori text with correct macrons |
| `en` | Accepted English answers; the first is canonical for display |

### Word only

| Attribute | Notes |
|-----------|-------|
| `image` | Optional `{ emoji }` or `{ svg }`; required for Picture mode eligibility |

### Sentence only

| Attribute | Notes |
|-----------|-------|
| `tiles` | The sentence split into ordered tiles (lowercase except proper nouns) |
| `altOrders` | Other valid tile orders, each a permutation of `tiles` |
| `decoys` | Plausible wrong tiles for Order mode |

## Counts

Beginner: 60 words, 20 sentences. Intermediate: 40 words, 20 sentences. At least 30 Beginner and 20 Intermediate words have an image.

Code: `src/game/types.ts`, `src/content/content.ts`, `src/content/content.test.ts`.
