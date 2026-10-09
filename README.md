# Ako

Ako: learn te reo Māori, one kupu at a time.

Ako is a free, mobile-friendly web app for learning te reo Māori vocabulary and sentence structure through four
drag-and-drop exercise modes: Match, Translate, Order and Picture, plus a Mixed mode. It is a proof of concept:
game logic runs entirely in the browser, and [Supabase](https://supabase.com) provides authentication and
per-user progress.

The full specification and implementation plan live in
[`changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/`](changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md).

## How it works

- **Modes:** Match (drag Māori words onto English meanings), Picture (drag words onto pictures), Translate (type the
  English for a Māori word or sentence), Order (drag tiles into the right sentence order) and Mixed (a random mix).
  Every drag can also be done by tap or keyboard.
- **Levels:** Beginner (60 words, 20 sentences) and Intermediate (40 words, 20 sentences). Intermediate unlocks once
  every Beginner item has been answered correctly at least once.
- **Rounds:** 10 questions, one retry per question, and missed questions are replayed once at the end. An unfinished
  round can be resumed.
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
npm run dev         # start the dev server
npm run build       # type-check and build for production
npm run preview     # preview a production build locally
npm run lint         # run ESLint
npm run typecheck    # run the TypeScript compiler with no output
npm test            # run the Vitest unit test suite
```

## Setup

See [`docs/SETUP.md`](docs/SETUP.md) for the one-time Supabase, Google OAuth and GitHub configuration needed to
run this project, plus local development instructions.

## Content

Ako's word and sentence content has not yet been reviewed by a fluent te reo Māori
speaker. The app shows this note to learners; see [`docs/SETUP.md`](docs/SETUP.md) and the spec for details.
