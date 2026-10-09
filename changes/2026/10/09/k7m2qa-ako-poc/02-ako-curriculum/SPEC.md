---
title: Ako v2: Full Learning Path
type: feature
change_id: ako-poc-2
workflow: k7m2qa-ako-poc
status: approved
created: 2026-10-09
approved: 2026-10-09
approved_by: user (delegated: "build the app, don't stop, full end to end Māori language learning")
depends_on: ako-poc-1 (merged, live)
---

# Ako v2: Full Learning Path

## 1. Overview

### Background
The PoC (ako-poc-1) is live. Learners can sign in, practise 140 items in four modes and track XP and streaks. It tests what learners know but does not **teach**. There is no structured path, no explanations of grammar or pronunciation, no production practice (writing Māori) and no long-term review.

### Goal
Turn Ako into a complete, self-guided te reo Māori course from first words to advanced sentences:

**Learn** (introduce new words and a grammar pattern) → **Practise** (exercises on that unit) → **Unit check** (pass to unlock the next unit) → **Review** (spaced repetition keeps everything fresh).

### Current State
React 19 + Vite SPA on GitHub Pages, Supabase auth + `profiles`, `item_progress`, `rounds` (RLS). Content is bundled in `src/content/content.json` (100 words, 40 sentences, levels beginner/intermediate). Modes: Match, Translate (Māori → English), Order, Picture, Mixed. 139 unit tests.

## 2. User Stories

| # | Story |
|---|---|
| US1 | As a learner, I want a clear path of units so that I always know what to learn next. |
| US2 | As a learner, I want new words introduced with meaning, image and a usage example before I'm tested. |
| US3 | As a learner, I want short grammar notes per unit so that I understand *why* sentences are built that way. |
| US4 | As a learner, I want a pronunciation guide so that I can say words correctly. |
| US5 | As a learner, I want to write Māori from English (with easy macron input) so that I can produce the language, not just recognise it. |
| US6 | As a learner, I want to fill gaps in Māori sentences so that I practise grammar in context. |
| US7 | As a learner, I want a daily Review of words due for revision so that I don't forget them. |
| US8 | As a learner, I want an Advanced level so that I can keep progressing. |
| US9 | As a learner, I want my PoC progress kept so that I don't start over. |
| US10 | As a learner, I want to look up any word I've met in a glossary. |

## 3. Functional Requirements

### FR1: Curriculum structure
- FR1.1 Three levels: **Beginner**, **Intermediate**, **Advanced**.
- FR1.2 Each level contains ordered **units**: Beginner 8, Intermediate 8, Advanced 6 (22 units).
- FR1.3 Each unit has: `id`, `level`, `order`, `title` (English), `titleMi` (Māori, e.g. "Ngā Mihi"), `emoji` icon, 10–14 **words**, 5–7 **sentences**, and one **grammar note** (§FR4).
- FR1.4 Content targets: **~280 words, ~140 sentences** in total. All 140 existing items are kept with their **existing ids** and assigned to units (so existing `item_progress` stays valid). New ids follow the existing scheme. Advanced items use `level: 'advanced'`.
- FR1.5 Suggested unit themes (the dev team may adjust):
  - **Beginner**: Greetings & introductions · Whānau · Numbers 1–10 · Colours · Animals · Food & drink · Body · Home & school.
  - **Intermediate**: Days & time · Common actions (verbs) · Places & travel · Feelings · Clothes & things · Nature & weather · Past & future (tense markers) · Possession (tōku/tāku, ō/ā).
  - **Advanced**: Numbers 11–100 & counting things · Questions in depth (wai, aha, hea, āhea, pēhea, he aha ai) · Commands & requests (me, kaua, kia) · Describing people & places · Marae & tikanga vocabulary · Stories & connected sentences (ā, nā te mea, engari, nō reira).
- FR1.6 Content is still bundled JSON. Split it into `src/content/units/*.json` (one per unit) plus `src/content/grammar/*.md`, assembled by a typed loader. Keep the in-app note that content has not yet been reviewed by a fluent speaker.

### FR2: Path & unlocking
- FR2.1 **Home becomes the Path**: a vertical, mobile-first list of units grouped by level. Each unit shows its state: `locked`, `available`, `in progress` or `complete`, with a crown/check and best unit-check score.
- FR2.2 Unit 1 of Beginner is available to everyone. A unit unlocks when the **previous unit's check is passed** (≥ 80%).
- FR2.3 The first unit of a level unlocks when **all units of the previous level are complete**.
- FR2.4 **Migration of PoC progress**: users with `beginner_completed_at` set have all Beginner units complete. Otherwise a unit is complete if every one of its items was already learned (`first_correct_at` not null), so existing learners skip what they already know.
- FR2.5 **Free Practice** (the PoC level + mode picker) stays available from the Path for any **unlocked** level, including the new modes.

### FR3: Learn (lesson intro)
- FR3.1 Entering an available unit for the first time opens **Learn**: a swipeable/clickable card deck, one card per new word. Each card shows the Māori (large, `lang="mi"`), English meaning(s), image (emoji) and one example sentence from the unit containing that word where available.
- FR3.2 After the word cards come the unit's **grammar note** card(s), then a "Start practice" button.
- FR3.3 Learn can be revisited at any time from the unit screen. Completing Learn marks `unit_progress.learned_at`.

### FR4: Grammar notes
- FR4.1 One short note per unit (≤ 200 words): the pattern, 2–4 examples with English, and one "watch out" tip. Examples: Beginner Greetings: *Kia ora / Tēnā koe, tēnā kōrua, tēnā koutou* (1/2/3+ people). Home: *He … tēnei / tēnā / tērā* (this/that near you/over there). Intermediate tense: *Kei te / I / Ka / E … ana*. Possession: *t-/ø* plural rule, *a/o* categories.
- FR4.2 Notes are Markdown files rendered with a tiny, safe renderer (headings, bold, italics, lists only; no raw HTML). The Path has a **Grammar** screen listing all notes for unlocked units.

### FR5: Unit practice and unit check
- FR5.1 **Practice**: a 10-question round drawn only from the unit's items (revising older words is the job of the Review tab), using a mix of all modes eligible for those items. Same retry/reveal/re-queue/XP rules as the PoC.
- FR5.2 **Unit check**: a 12-question Mixed round from the unit's items, with **no reveal-after-retry hints for boards** (a wrong drop still bounces back). Pass = ≥ 80% (≥ 10/12). Passing marks the unit complete, stores `best_score` and shows a celebration on Results. Failing shows which items were missed and a "Practise again" button.
- FR5.3 A unit check can be attempted at any time once Learn is done.

### FR6: New modes
- FR6.1 **Write (English → Māori)**: shows English, the learner types Māori. Under the input is a **macron keyboard row** (ā ē ī ō ū and Ā Ē Ī Ō Ū) that inserts at the cursor. Marking reuses the lenient normaliser; a **missing macron** is accepted but shows "Correct, watch the macron: kurī" (counts as first-try). Other typo tolerance as Translate. Words and short sentences (≤ 6 tiles) only.
- FR6.2 **Fill the gap**: a Māori sentence with one tile blanked, plus 4 chip options (the answer + 3 distractors from same-level tiles, preferring the same word type, e.g. particles for particles). Drag a chip into the gap or tap it. Sentences only.
- FR6.3 Both modes are added to Mixed, Free Practice and the mode picker. Mode list order: Match, Picture, Translate, Write, Fill the gap, Order, Mixed.

### FR7: Spaced-repetition Review
- FR7.1 Every learned item gets an SRS schedule (simplified SM-2): on a correct first try `interval = max(1, round(interval × ease))`, `ease += 0.1` (cap 3.0). On retry the interval is unchanged and `ease -= 0.15`. On missed `interval = 1`, `ease -= 0.2` (floor 1.3), `lapses += 1`. `due_at = today + interval days` (learner's local date). New items start at `interval = 1, ease = 2.5`.
- FR7.2 The Path header shows **"Review (N due)"** when N > 0. Review is a round of up to 15 due items (most overdue first) in Mixed modes, without a unit check. XP as normal.
- FR7.3 Board questions update every item on the board individually (correct before reveal = first or retry by that word's wrong drops).
- FR7.4 Existing learned items get `due_at = today` on first load after migration so they enter Review gradually: cap Review at 15 per round.

### FR8: Pronunciation guide
- FR8.1 A static **Pronunciation** screen: the 5 vowels (short/long with macron), the digraphs **wh** and **ng**, the consonants, and syllable stress basics, each with English sound-alike guidance and example words from the course.
- FR8.2 No audio in v2 (no recorded speaker is available). Out of scope: TTS.

### FR9: Glossary
- FR9.1 A **Glossary** screen with search (accent-insensitive: "kuri" finds "kurī") over words from unlocked units, showing Māori, English, unit and a learned ✓ when learned.

### FR10: Stats
- FR10.1 Progress screen adds: units completed per level, items learned per level, due-for-review count, and the existing history.

### FR11: Navigation
| Route | Purpose |
|---|---|
| `#/home` | Path (units, Review button, Free Practice entry) |
| `#/unit/:unitId` | Unit screen: Learn, Practice, Unit check, grammar note, best score |
| `#/unit/:unitId/learn` | Learn deck |
| `#/unit/:unitId/practice` · `#/unit/:unitId/check` | Rounds |
| `#/review` | Review round |
| `#/practice` · `#/play/:level/:mode` | Free Practice (existing) |
| `#/grammar` · `#/pronunciation` · `#/glossary` | Reference screens |
| `#/progress` · `#/account` · `#/privacy` | Existing |

The nav bar becomes: **Learn** (Path) · **Review** · **Reference** (Grammar, Pronunciation, Glossary) · **Progress** · **Account**. On mobile it is a bottom tab bar.

## 4. Non-Functional Requirements
Same as ako-poc-1 (mobile-first 360px, touch + keyboard drag, AA contrast, reduced motion, `lang="mi"`, no em dashes, no references to the tools that built the app) plus:
- Initial JS ≤ 250 KB gzipped. Lazy-load the reference screens and unit JSON by level if needed.
- Unit JSON content is validated by tests (FR12).

## 5. Technical Design

### 5.1 Content
```ts
type Level = 'beginner' | 'intermediate' | 'advanced';
interface Unit {
  id: string;              // "b01-greetings"
  level: Level; order: number;
  title: string; titleMi: string; emoji: string;
  itemIds: string[];       // words + sentences in this unit (items defined in the same file)
  grammar: string;         // grammar note file id, e.g. "b01-greetings"
}
// src/content/units/b01-greetings.json => { unit: Unit, items: Item[] }
```
Each item belongs to exactly one unit. `Item.level` equals its unit's level.

### 5.2 Database (new migration `20261010000000_curriculum.sql`; never edit the init migration)
```sql
create table public.unit_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_id text not null,
  learned_at timestamptz,
  completed_at timestamptz,
  best_score integer,
  attempts integer not null default 0,
  primary key (user_id, unit_id)
);
alter table public.item_progress
  add column ease real not null default 2.5,
  add column interval_days integer not null default 1,
  add column due_on date,
  add column lapses integer not null default 0;
alter table public.rounds drop constraint if exists rounds_level_check;
alter table public.rounds add constraint rounds_level_check check (level in ('beginner','intermediate','advanced'));
alter table public.rounds drop constraint if exists rounds_mode_check;
alter table public.rounds add constraint rounds_mode_check
  check (mode in ('match','translate','order','picture','write','gap','mixed','review','unit_practice','unit_check'));
alter table public.rounds add column unit_id text;
```
RLS on `unit_progress` mirrors `item_progress` (own rows only, all four operations). Check the real constraint names in the init migration before dropping them.

### 5.3 Pure logic (new, unit-tested)
`srs.ts` (schedule update, due selection), `unitUnlock.ts` (unit/level states, PoC migration rule), `unitRound.ts` (practice/check/review generation), `gapGenerator.ts` (distractors), `macronMarking.ts` (macron-insensitive compare + "watch the macron" flag), `glossarySearch.ts` (accent-insensitive search), `grammarMarkdown.ts` (safe mini renderer).

## 6. Acceptance Criteria
| # | Given | When | Then |
|---|---|---|---|
| AC1 | a new learner | they open Home | they see the Path with Beginner Unit 1 available and all others locked |
| AC2 | Unit 1 available | they open it the first time | the Learn deck shows each new word with meaning, emoji and an example, then the grammar note |
| AC3 | Learn complete | they pass the unit check with ≥ 10/12 | Unit 1 is complete and Unit 2 unlocks |
| AC4 | they score 9/12 | - | the unit is not complete and missed items are listed |
| AC5 | a PoC learner with `beginner_completed_at` | they open Home | all Beginner units are complete and Intermediate Unit 1 is available |
| AC6 | a Write question for "dog" | they type "kuri" | it is accepted with the "watch the macron: kurī" note |
| AC7 | a Write question | they tap ā on the macron row | ā is inserted at the cursor |
| AC8 | a Fill-the-gap question | they drag the right chip into the gap | it is marked correct; wrong chip follows retry/reveal rules |
| AC9 | items due today | they open Review | up to 15 due items appear, most overdue first; results update ease/interval/due_on |
| AC10 | any learner | they open Pronunciation | vowels, macrons, wh, ng and examples are shown, without sign-in issues |
| AC11 | Glossary | they search "kuri" | "kurī: dog" is found |
| AC12 | all Intermediate units complete | - | Advanced Unit 1 unlocks |
| AC13 | a phone at 360px | they use the Path and every mode | usable with no horizontal scroll; bottom tab bar visible |

## 7. Testing Strategy
Unit tests only (Vitest), extending the existing suite:
- content: per-unit item counts (10–14 words, 5–7 sentences), totals (≥ 270 words, ≥ 135 sentences), all 140 PoC ids still present, unique ids, each item in exactly one unit, grammar file exists per unit, tiles/decoys rules, no em dashes.
- srs, unitUnlock (including PoC migration rule), unitRound, gapGenerator, macronMarking, glossarySearch, grammarMarkdown (rejects raw HTML).

## 8. Out of Scope
Audio/TTS/recordings, speech recognition, leaderboards/social, teacher dashboards, content editing UI, native apps, offline/PWA, custom domain, E2E tests.

## 9. Open Questions
| # | Question | Status |
|---|---|---|
| O1 | Unit counts and themes | ASSUMED (§FR1.2, FR1.5) |
| O2 | Unit-check pass mark | ASSUMED 80% (10/12) |
| O3 | SRS algorithm | ASSUMED simplified SM-2 (§FR7.1) |
| O4 | Missing macron in Write | ASSUMED accepted with a note, counts as first try |
| O5 | Audio | DEFERRED (no fluent speaker recordings available) |
| O6 | Fluent-speaker content review | DEFERRED (in-app note remains) |

No OPEN questions.

## 10. Requirements Discovery
| # | Question | Answer | Source |
|---|---|---|---|
| V1 | What should follow the PoC? | "Build the app, don't stop, full end to end Māori language learning" | User |
| V2 | Who decides scope details? | "You can answer all questions, do not wait for me" (standing instruction) | User |
| V3 | Scope chosen | Learn → Practise → Unit check → Review path, 3 levels/22 units, grammar notes, pronunciation guide, Write and Fill-the-gap modes, SRS, glossary | Dev team (delegated) |
