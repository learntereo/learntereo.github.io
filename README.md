# Ako

Ako: learn te reo Māori, one kupu at a time.

Ako is a free, mobile-friendly web app for learning te reo Māori from first words to connected sentences. A
learning path of 22 units takes you through three levels, with games to practise, a check to pass each unit and
spaced-repetition review to keep words fresh. Game logic runs entirely in the browser, and
[Supabase](https://supabase.com) provides authentication and per-user progress.

The specifications and implementation plans live in
[`changes/2026/10/09/k7m2qa-ako-poc/`](changes/2026/10/09/k7m2qa-ako-poc/): the
[PoC](changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md) and the
[full learning path](changes/2026/10/09/k7m2qa-ako-poc/02-ako-curriculum/SPEC.md).

## How it works

- **The Path:** 22 units in three levels: Beginner (8), Intermediate (8) and Advanced (6). Each unit has 10-14 words,
  5-7 sentences and a short grammar note. Unit 1 is open to everyone; a unit opens when the one before it is complete.
- **Learn, practise, check:** each unit starts with a card deck of its new words (with pictures and examples) and the
  grammar note. Then comes a 10-question practice round and a 12-question unit check. Get 10 of 12 to pass and open the
  next unit.
- **Games:** Match, Picture, Translate, Write (English to Māori, with a macron key row), Fill the gap, Order and Mixed.
  Every drag can also be done by tap or keyboard.
- **Review:** each word you have learned is rescheduled by a simplified SM-2 rule. "Review (N due)" gives you a round
  of up to 15 words that are ready to be remembered again.
- **Free practice:** pick any open level and a game.
- **Reference:** a grammar index, a pronunciation guide and a glossary that finds "kurī" when you type "kuri".
- **Rounds:** one retry per question, and missed questions are replayed once at the end (not in a unit check). An
  unfinished round can be resumed.
- **XP and streaks:** +10 XP for a first-try answer, +5 for a retry, +20 for finishing a round. Completing at least
  one round per local day builds your streak.

## Stack

- React 19 + TypeScript + Vite, built as a static SPA (`HashRouter`, since GitHub Pages has no SPA rewrites)
- [Supabase](https://supabase.com): Google and email/password auth, Postgres with Row Level Security
- [dnd-kit](https://docs.dndkit.com) for touch, mouse and keyboard drag-and-drop
- Vitest for unit tests, ESLint (typescript-eslint) for linting
- Deployed to GitHub Pages via GitHub Actions

## Scripts

```sh
npm run dev           # start the dev server
npm run build         # type-check and build for production
npm run preview       # preview a production build locally
npm run lint          # run ESLint
npm run typecheck     # run the TypeScript compiler with no output
npm test              # run the Vitest unit test suite
npm run content:index # rebuild src/content/unitIndex.json after changing a unit file
```

## Setup

See [`docs/SETUP.md`](docs/SETUP.md) for the one-time Supabase, Google OAuth and GitHub configuration needed to
run this project, plus local development instructions.

## Content

Content is bundled with the app, not stored in Supabase:

- `src/content/units/*.json`: one file per unit, holding the unit header and its words and sentences. Ids never
  change, because saved progress is keyed by them (`w-b-001` is a Beginner word, `s-i-004` an Intermediate sentence,
  `w-a-001` an Advanced word).
- `src/content/grammar/*.md`: one grammar note per unit, at most 200 words. Only headings, lists, **bold** and *italic*
  (used for Māori) are rendered, and raw HTML is never interpreted.
- `src/content/unitIndex.json`: the unit headers, built from the unit files with `npm run content:index`. A test fails
  if it is out of date.

Words, sentences and grammar notes load one level at a time, so the app only downloads the levels a learner has
reached. The initial JavaScript is about 182 KB gzipped.

Ako's content has not yet been reviewed by a fluent te reo Māori speaker. The app shows this note to learners; please
check anything that matters with a *kaiako* (teacher).
