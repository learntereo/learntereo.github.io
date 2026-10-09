---
title: Ako: Māori Language Learning PoC
type: feature
change_id: ako-poc-1
workflow: k7m2qa-ako-poc
status: approved
created: 2026-10-09
approved: 2026-10-09
approved_by: user (delegated: "you can answer all questions, do not wait for me")
domain: Language Learning
repo: https://github.com/pattern-labs-foundation/language-learning-website
---

# Ako: Māori Language Learning PoC

> **Ako**: in te reo Māori, *ako* means both "to learn" and "to teach", the reciprocal idea that teacher and learner learn from each other.
> Tagline: *"Ako: learn te reo Māori, one kupu at a time."*

## 1. Overview

### Background
A free, public, mobile-friendly web app that teaches te reo Māori vocabulary and sentence structure through four drag-and-drop-first exercise modes. Anyone who finds it on the web can sign in and learn. The app is a proof of concept (PoC): all game logic runs in the browser, and Supabase provides authentication and per-user state.

### Current State
The repository `pattern-labs-foundation/language-learning-website` contains only an initial commit with a `README.md`. A Supabase project exists (ref `zmdbimnvxpbmnctqefcu`, Asia-Pacific region) with no schema yet.

### Goals (PoC success)
A learner can sign in (Google, or email and password), pick a level and a mode, play a 10-question round in any of the four modes or Mixed, and have their progress, XP, streak, score history and in-progress round saved. Intermediate unlocks once Beginner is complete. The site deploys automatically to GitHub Pages when a PR merges to `main`.

## 2. User Stories

| # | Story |
|---|-------|
| US1 | As a **visitor**, I want to sign in with Google (or email and password) so that my progress is saved. |
| US2 | As a **learner**, I want to choose a level (Beginner / Intermediate) so that content suits my ability. |
| US3 | As a **learner**, I want to choose an exercise mode (Match, Translate, Order, Picture, Mixed) so that I can practise in different ways. |
| US4 | As a **learner**, I want to drag Māori words onto their English meanings (Match) so that I learn vocabulary. |
| US5 | As a **learner**, I want to type the English for a Māori word or sentence (Translate) so that I test recall. |
| US6 | As a **learner**, I want to drag Māori word tiles into the correct order (Order) so that I learn sentence structure. |
| US7 | As a **learner**, I want to drag Māori words onto matching pictures (Picture) so that I connect words to meaning visually. |
| US8 | As a **learner**, I want a score, XP and streak at the end of each round so that I stay motivated. |
| US9 | As a **learner**, I want to resume a round I left partway through so that I don't lose progress. |
| US10 | As a **learner**, I want Intermediate to unlock once I've completed Beginner so that I progress in a structured way. |
| US11 | As a **learner**, I want to see my past round scores so that I can track improvement. |
| US12 | As a **learner**, I want to read what data is stored and delete my account and data so that I control my privacy. |
| US13 | As a **maintainer**, I want PR checks and automatic deploy on merge to `main` so that only working code ships. |

## 3. Functional Requirements

### FR1: Authentication
- FR1.1 Sign-in is **required** to play. Unauthenticated users see the landing/sign-in page and the Privacy page only.
- FR1.2 **Google sign-in** via Supabase OAuth (primary button).
- FR1.3 **Email and password** sign-up and sign-in as the alternative. Supabase email confirmation stays enabled.
- FR1.4 **Forgot password** flow for email and password users (Supabase `resetPasswordForEmail` and an update-password screen). *(Assumed, see O1.)*
- FR1.5 Sign out from the Account screen.
- FR1.6 A `profiles` row is created automatically for each new auth user (DB trigger).

### FR2: Content
- FR2.1 Content is a **bundled JSON file** (`src/content/content.json`), not stored in Supabase.
- FR2.2 **100 words** and **40 sentences**, authored by the dev team, organised **by level**:
  - Beginner: 60 words, 20 sentences
  - Intermediate: 40 words, 20 sentences *(split assumed, see O4)*
- FR2.3 Each item has a stable `id`, `level`, `kind` (`word` | `sentence`), Māori text `mi` (with correct macrons), and accepted English answers `en: string[]` (first entry is canonical for display).
- FR2.4 Each sentence has `tiles: string[]`, the Māori sentence split into ordered tiles. It may have `altOrders: string[][]` (other valid orderings) and `decoys: string[]` (plausible wrong tiles).
- FR2.5 Words may have an `image`: either `{ "emoji": "🐕" }` or `{ "svg": "<id>" }`, referencing a small, original inline SVG icon in `src/content/icons/`. At least **30 beginner** and **20 intermediate** words must have an image (so the Picture mode has enough content).
- FR2.6 Content must be validated by a unit test (counts, unique ids, macron-bearing vowels allowed, tiles non-empty, decoys not in tiles, image counts).
- FR2.7 The app shows a visible note (footer / About) that content has not yet been reviewed by a fluent speaker. *(See O2.)*

### FR3: Levels and unlock
- FR3.1 Two levels: **Beginner** and **Intermediate**. (Advanced is future work.)
- FR3.2 Intermediate is **locked** until Beginner is complete.
- FR3.3 Beginner is **complete** when **every beginner item (all 60 words and 20 sentences) has been answered correctly at least once**, in any mode.
- FR3.4 When Beginner completes, set `profiles.beginner_completed_at` and show an unlock celebration on the results screen.
- FR3.5 The Home screen shows Beginner progress as "N / 80 items learned".

### FR4: Rounds
- FR4.1 The learner picks **level** then **mode** (Match, Translate, Order, Picture, Mixed).
- FR4.2 A round is **10 questions**. A progress bar shows `n / 10`.
- FR4.3 Question selection prioritises items **not yet answered correctly** (up to 7 of 10 questions when available), then fills the rest from learned items for review. No item repeats within a round, except re-queued misses.
- FR4.4 **Mixed** picks a random eligible mode per question. Picture is eligible only if enough image items exist, and Order only for sentences.
- FR4.5 A wrong answer allows **one retry**. After a second wrong answer, the correct answer is shown and the question counts as **missed**.
- FR4.6 Missed questions are **re-queued once** at the end of the round. Re-queued attempts give no XP but **do** count toward item mastery when correct.
- FR4.7 Score shown on the results screen: `correct / 10` (based on the original 10 questions; first-try or retry both count as correct).
- FR4.8 The results screen shows score, XP earned, current streak, newly learned items count and buttons to *Play again* or go *Home*.

### FR5: Mode: Match
- FR5.1 One question is a board of **5 pairs**: Māori words (draggable chips) on one side, their shuffled English meanings (drop targets) on the other. English uses the canonical `en[0]`.
- FR5.2 Drag a Māori word onto an English target. **Correct** locks the pair (green). **Wrong** makes the chip **bounce back** to its origin (shake animation) and records a wrong drop for that word.
- FR5.3 A word with **2 wrong drops** has its correct target highlighted (answer shown). The learner then completes the drop, and that word counts as missed.
- FR5.4 Each pair updates item mastery individually: correct before reveal = learned.
- FR5.5 Question result: **first-try** if no wrong drops, **retry** if wrong drops but no reveals, **missed** if any reveal. *(Assumed, see O5.)*
- FR5.6 Only `word` items are used.

### FR6: Mode: Translate
- FR6.1 Shows a Māori word or sentence. The learner **types the English** and presses *Check* (or Enter).
- FR6.2 Marking (lenient):
  - case-insensitive; trims and collapses whitespace; strips punctuation (`. , ! ? ' " ; :` etc.)
  - ignores leading articles `a`, `an`, `the` and leading `to ` for verbs
  - accepts **any** entry in `en[]`
  - **typo tolerance**: Levenshtein distance ≤ 1 for normalised answers ≤ 8 characters, ≤ 2 for longer answers
- FR6.3 Wrong first answer: "Not quite, try again". Wrong second answer: show the canonical answer and a *Continue* button.
- FR6.4 Uses both `word` and `sentence` items. *(Assumed, see O7.)*
- FR6.5 Direction is **Māori → English only**.

### FR7: Mode: Order
- FR7.1 Shows the English sentence (`en[0]`). Below it is an empty **answer row** and a **tile bank** with the shuffled Māori `tiles` plus **decoys** (1 for beginner, 2 for intermediate).
- FR7.2 Drag tiles from the bank into the answer row, reorder within the row, and drag back to the bank. **Tapping** a tile also moves it between bank and row (accessibility and ease on mobile; see O6).
- FR7.3 *Check* is enabled when the answer row is non-empty. Correct = answer row equals `tiles` or any `altOrders` (case-sensitive on macrons, ignores trailing punctuation tiles if any).
- FR7.4 Decoys come from the sentence's `decoys` field. If fewer are defined than needed, the app picks random tiles from other same-level sentences that are not in this sentence.
- FR7.5 Wrong behaves as in FR4.5 (one retry, then show the correct order).

### FR8: Mode: Picture
- FR8.1 One question is a board of **4 images** (emoji or SVG) in a 2×2 grid as drop targets, plus 4 shuffled Māori word chips.
- FR8.2 Drag behaviour, wrong-drop bounce, reveal-after-2 and result rules are identical to Match (FR5.2–FR5.5).
- FR8.3 Only `word` items with `image` are used.

### FR9: Progress, XP, streaks, history, resume
- FR9.1 **Item progress**: per user per item, record attempts, correct count and `first_correct_at`.
- FR9.2 **XP**: +10 per question correct first try, +5 per question correct on retry, 0 for missed or re-queued, and +20 bonus on round completion. The total is stored in `profiles.xp`.
- FR9.3 **Streak**: on round completion, using the learner's **local date**:
  - `last_active_date == today` → unchanged
  - `last_active_date == yesterday` → `current_streak + 1`
  - otherwise → `1`
  - `longest_streak = max(longest_streak, current_streak)`
  - Display rule: if `last_active_date` is before yesterday, show the streak as **0**.
- FR9.4 **Score history**: every completed round is stored (level, mode, score, total, XP earned, completed time). The Progress screen lists the most recent 20.
- FR9.5 **Resume**: the in-progress round state (question list, current index, results so far, re-queue) is saved to Supabase after every answered question. Home shows *Resume round* if one exists. Starting a new round while one is in progress asks for confirmation and marks the old one `abandoned`.
- FR9.6 At most **one** in-progress round per user (DB-enforced).

### FR10: Privacy and account
- FR10.1 Public **Privacy** page (no sign-in needed) explains what is stored (name/email from sign-in, item progress, rounds, XP, streak) and where (Supabase, Asia-Pacific region), that it is not sold or shared, and how to delete it.
- FR10.2 The **Account** screen has a **Delete my account and data** button. It shows a confirmation dialog (type `DELETE` to confirm), then calls the `delete_my_account()` RPC, which deletes the auth user and cascades all data. The user is signed out and returned to the landing page.

### FR11: Screens / navigation
| Route (hash) | Auth | Purpose |
|---|---|---|
| `#/` | public | Landing + sign-in (Google button, email/password form, forgot password link) |
| `#/privacy` | public | Privacy page |
| `#/reset-password` | public (recovery session) | Set a new password |
| `#/home` | required | Level cards (lock state, progress), XP, streak, Resume button |
| `#/play/:level` | required | Mode picker |
| `#/play/:level/:mode` | required | Round screen |
| `#/results/:roundId` | required | Round results |
| `#/progress` | required | Score history + stats |
| `#/account` | required | Sign out, delete account |

### FR12: CI/CD and branching
- FR12.1 All new work is on **feature branches**. Changes reach `main` only via PR.
- FR12.2 **PR checks** (`.github/workflows/ci.yml`, on `pull_request` to `main`): `npm ci`, lint (ESLint), type-check (`tsc --noEmit`), unit tests (Vitest), production build. All must pass. Branch protection on `main` requires the `ci` check (configured by a repo admin; see O3).
- FR12.3 **Deploy** (`.github/workflows/deploy.yml`, on `push` to `main`, i.e. a merged PR):
  1. Job `migrate`: Supabase CLI `supabase db push --db-url` against the session pooler (`vars.SUPABASE_DB_HOST`, `vars.SUPABASE_PROJECT_REF`, `secrets.SUPABASE_DB_PASSWORD`). No access token.
  2. Job `deploy` (needs `migrate`): build with Vite and deploy to GitHub Pages using `actions/upload-pages-artifact` and `actions/deploy-pages`.
- FR12.4 The site is served at `https://pattern-labs-foundation.github.io/language-learning-website/` (default Pages URL; no custom domain).

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Mobile-first | Fully usable from 360px wide. Touch drag-and-drop works on iOS Safari and Android Chrome. No horizontal scroll. Tap targets ≥ 44px. |
| Performance | Initial JS ≤ 250 KB gzipped. LCP < 2.5s on a mid-range phone over 4G. Content JSON loaded with the bundle. |
| Accessibility | WCAG 2.1 AA colour contrast. All drag interactions also operable by keyboard (dnd-kit keyboard sensor) and by tap (Order). Respects `prefers-reduced-motion`. `lang="mi"` on Māori text. |
| Typography | Fonts must render macrons (ā ē ī ō ū Ā Ē Ī Ō Ū) correctly. |
| Security | Supabase Row Level Security on every table. Only the publishable/anon key ships to the browser. No service-role key anywhere in the repo or CI. |
| Reliability | Progress writes retry up to 3 times with backoff. Failures show a non-blocking toast; gameplay continues. |
| Writing style | Em dashes (U+2014) must never be committed: enforced by `.githooks/pre-commit` (`git config core.hooksPath .githooks`) and a CI step running `scripts/check-no-em-dash.sh`. |
| SEO | Static `index.html` includes title, description, Open Graph tags and readable landing text, so the site can be found by search engines. |
| Browsers | Latest two versions of Chrome, Safari (iOS and macOS), Firefox, Edge. |

## 5. Technical Design

### 5.1 Architecture

```text
┌──────────────── Browser (GitHub Pages, static) ────────────────┐
│  React 19 + TypeScript + Vite SPA (HashRouter)                  │
│   ├─ ui/        screens, components, dnd-kit boards             │
│   ├─ game/      pure logic: marking, round gen, XP, streak,     │
│   │             unlock, order check   (100% unit tested)        │
│   ├─ content/   content.json + icons (bundled)                  │
│   └─ data/      supabase client + repositories (profiles,      │
│                 item_progress, rounds)                          │
└───────────────┬────────────────────────────────────────────────┘
                │ supabase-js (HTTPS, JWT, RLS)
┌───────────────▼────────────────────────────────────────────────┐
│ Supabase (ref zmdbimnvxpbmnctqefcu)                             │
│  Auth: Google OAuth, email/password    Postgres: 3 tables + RLS │
│  RPC: delete_my_account()              Trigger: create profile │
└─────────────────────────────────────────────────────────────────┘
```

**Stack decisions** (delegated to the dev team by user, S14b):
- **React 19 + TypeScript + Vite**: light, fast, web-native, SEO-friendly static output.
- **@dnd-kit/core + @dnd-kit/sortable**: touch, mouse and keyboard sensors; good mobile drag-and-drop.
- **react-router (HashRouter)**: GitHub Pages has no SPA rewrites. Hash routes avoid 404s on refresh.
- **@supabase/supabase-js v2** with `flowType: 'pkce'`, so the OAuth return uses `?code=` (query string) rather than the URL hash, which avoids clashing with HashRouter.
- **Vitest** for unit tests. **ESLint** (typescript-eslint) for lint.
- Plain CSS with CSS custom properties (design tokens) in CSS Modules. No UI framework, to keep the bundle small.
- Vite `base: '/language-learning-website/'`.

### 5.2 Repository layout

```text
/
├── .github/workflows/ci.yml, deploy.yml
├── supabase/
│   ├── config.toml
│   └── migrations/20261009000000_init.sql
├── src/
│   ├── main.tsx, App.tsx, routes.tsx
│   ├── content/content.json, content.ts (typed loader), icons/*.svg|tsx
│   ├── game/ marking.ts, levenshtein.ts, roundGenerator.ts, xp.ts,
│   │         streak.ts, unlock.ts, orderCheck.ts, boardResult.ts, types.ts
│   │         (+ *.test.ts alongside)
│   ├── data/ supabaseClient.ts, profileRepo.ts, progressRepo.ts, roundRepo.ts, retry.ts
│   ├── auth/ AuthProvider.tsx, RequireAuth.tsx
│   ├── ui/   screens/*, components/*, modes/{Match,Translate,Order,Picture}.tsx
│   └── styles/ tokens.css, global.css, patterns (kōwhaiwhai-inspired SVG)
├── public/ favicon.svg, og-image.png (optional), 404.html
├── docs/SETUP.md        # Supabase + Google OAuth + GitHub setup guide
├── .env.example         # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── index.html, vite.config.ts, tsconfig*.json, eslint.config.js, package.json
```

### 5.3 Content schema (`content.json`)

```ts
type Level = 'beginner' | 'intermediate';
interface WordItem {
  id: string;            // e.g. "w-b-001"
  kind: 'word';
  level: Level;
  mi: string;            // "kurī"
  en: string[];          // ["dog"]
  image?: { emoji: string } | { svg: string };
}
interface SentenceItem {
  id: string;            // e.g. "s-b-001"
  kind: 'sentence';
  level: Level;
  mi: string;            // "Kei te pai ahau"
  en: string[];          // ["I am good", "I'm good", "I am well"]
  tiles: string[];       // ["Kei", "te", "pai", "ahau"]
  altOrders?: string[][];
  decoys?: string[];     // ["koe"]
}
interface Content { version: number; items: (WordItem | SentenceItem)[] }
```

Suggested themes (for generation only, not a UI grouping): greetings, whānau, numbers 1–10, colours, animals, food, body, home, nature, days/time, common verbs, pronouns, questions, feelings, places.

### 5.4 Data model (Supabase Postgres)

```sql
-- profiles: one per auth user
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  xp integer not null default 0 check (xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_date date,
  beginner_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- item_progress: mastery per content item
create table public.item_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  attempt_count integer not null default 0,
  correct_count integer not null default 0,
  first_correct_at timestamptz,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- rounds: history + resumable state
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null check (level in ('beginner','intermediate')),
  mode text not null check (mode in ('match','translate','order','picture','mixed')),
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  state jsonb not null,
  score integer, total integer not null default 10,
  xp_earned integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index rounds_one_in_progress on public.rounds(user_id) where status = 'in_progress';
create index rounds_user_completed on public.rounds(user_id, completed_at desc);
```

- **RLS**: enabled on all three tables. Policies for `select`/`insert`/`update`/`delete`: `auth.uid() = id` (profiles) or `auth.uid() = user_id` (others). No `insert` policy on profiles (the trigger creates them). No `delete` on profiles (account deletion goes through the RPC).
- **Trigger** `on_auth_user_created` (security definer, `search_path = ''`): inserts into `public.profiles (id, display_name)` using `raw_user_meta_data->>'full_name'` or the email prefix.
- **Trigger** `set_updated_at` on profiles.
- **RPC** `public.delete_my_account()`: `security definer`, `search_path = ''`, `delete from auth.users where id = auth.uid()`. `grant execute ... to authenticated`, `revoke ... from anon, public`.

### 5.5 Key algorithms (pure functions in `src/game/`)
- `normaliseAnswer(s)` → lowercase, NFC normalise, strip punctuation, collapse whitespace, strip leading `a|an|the|to`.
- `isAnswerCorrect(input, accepted[])` → any accepted answer where `levenshtein(norm(input), norm(acc)) <= (norm(acc).length <= 8 ? 1 : 2)`.
- `generateRound(content, level, mode, progress, rng)` → 10 `Question`s. A Match board needs 5 words and a Picture board needs 4 image words, and the board's `primary` item is used for prioritisation. Unlearned items fill up to 7 slots first. The rng is injectable for deterministic tests.
- `checkOrder(answer, sentence)` → exact match against `tiles` or any `altOrders`.
- `boardResult(wrongDropsByWord, revealedWords)` → `'first' | 'retry' | 'missed'`.
- `xpForQuestion(result)`, `xpForRound(results)` (adds +20 bonus).
- `nextStreak(profile, todayLocal)`, `displayStreak(profile, todayLocal)`.
- `isBeginnerComplete(content, progress)`.

### 5.6 Design system
- **Look**: Māori-inspired palette and original kōwhaiwhai-style geometric patterns (koru curves as decorative borders and headers), combined with clean European editorial typography and layout. Patterns must be **original**, not copies of specific iwi designs.
- **Tokens**: `--kokowai` (red ochre) `#A3271F`, `--pango` (black) `#1B1714`, `--ma` (white/bone) `#F7F2E9`, `--pounamu` (greenstone) `#2E6B4F`, `--karaka` (ochre/amber) `#D98E2B`, plus neutral greys. Success = pounamu, error = kōkōwai.
- **Type**: headings in a serif (e.g. *Fraunces*), body/UI in a sans (e.g. *Inter*). Both are loaded from Google Fonts and support macrons.
- **Feel**: calm and uncluttered, with large tactile cards and chips, gentle motion (bounce-back shake, correct-pair glow), and confetti-free celebration (pattern flourish) on unlock.
- UI chrome language is English, with Māori greetings and labels used decoratively (e.g. "Kia ora, {name}", "Ka pai!" on correct answers).

## 6. API Contract
No custom backend. The browser uses supabase-js against the tables in §5.4 (protected by RLS) and the RPC `delete_my_account()`. Repository functions:

| Function | Supabase call |
|---|---|
| `getProfile()` | `profiles.select().eq('id', uid).single()` |
| `updateProfile(patch)` | `profiles.update(patch).eq('id', uid)` |
| `getItemProgress()` | `item_progress.select()` |
| `recordAttempts(rows)` | `item_progress.upsert(rows)` (client merges counts) |
| `getActiveRound()` | `rounds.select().eq('status','in_progress').maybeSingle()` |
| `startRound(...)` / `saveRoundState(id, state)` / `completeRound(id, …)` / `abandonRound(id)` | `rounds.insert/update` |
| `getHistory(limit=20)` | `rounds.select().eq('status','completed').order('completed_at',desc).limit(20)` |
| `deleteMyAccount()` | `rpc('delete_my_account')` |

## 7. Security Considerations
- RLS on every table. Each user can only read and write their own rows.
- Only the **publishable/anon** key is in the frontend (as GitHub repo **variables** at build time). It is public by design.
- CI secret: `SUPABASE_DB_PASSWORD` (repo **secret**). `SUPABASE_PROJECT_REF`, `SUPABASE_DB_HOST` (variables).
- **Known PoC limitation**: game logic is client-side, so a determined user can inflate their own XP, streak or progress. This only affects their own account (no leaderboards). Accepted for the PoC.
- OAuth redirect allow-list in Supabase: the Pages URL and `http://localhost:5173/`.
- Security-definer functions pin `search_path = ''`.
- No PII beyond what the auth provider gives (email, name).

## 8. Error Handling

| Situation | Behaviour |
|---|---|
| Supabase env vars missing at build/run | App shows a clear "Configuration missing" screen (dev aid) instead of crashing. |
| OAuth / sign-in error | Inline error message on the landing page; the learner can retry. |
| Email not confirmed | Message: "Check your email to confirm your account." |
| Progress write fails | Retry 3× with exponential backoff (0.5s, 1s, 2s), then toast "Couldn't save progress, we'll keep trying". Gameplay continues and pending writes stay in memory and retry on the next write. |
| Session expired | Redirect to landing with the message "Please sign in again". |
| Resume state is invalid (e.g. content ids changed) | Discard (mark `abandoned`) and start fresh, with a toast. |
| Insert in-progress round conflicts (unique index) | Load the existing in-progress round and offer resume or abandon. |
| Delete account fails | Error dialog. The account stays intact. |
| Offline | Toast "You're offline. Progress will save when you reconnect" (uses the same retry path). |

## 9. Observability
PoC level: structured `console.warn/error` for data-layer failures (no third-party analytics), plus the Supabase dashboard logs. No tracking cookies.

## 10. Acceptance Criteria

| # | Given | When | Then |
|---|---|---|---|
| AC1 | a visitor is not signed in | they open `#/home` | they are redirected to the landing page |
| AC2 | a visitor on the landing page | they click "Continue with Google" and complete consent | they arrive at Home, signed in, with a profile row created |
| AC3 | a visitor | they sign up with email and password and confirm their email | they can sign in and reach Home |
| AC4 | a new learner on Home | they view level cards | Beginner is playable and Intermediate shows a lock and "Complete Beginner to unlock" |
| AC5 | a learner starts a Beginner Match round | the round loads | a board of 5 Māori words and 5 English targets appears, with progress `1 / 10` |
| AC6 | a Match board | they drop a word on the wrong meaning | the chip bounces back and stays draggable |
| AC7 | a Match word dropped wrongly twice |: | its correct target is highlighted and that word counts as missed |
| AC8 | a Translate question for "kurī" (`en: ["dog"]`) | they type "The Dog!" or "dgo" | it is marked correct |
| AC9 | a Translate question | they answer wrong twice | the canonical answer is shown and the question is re-queued at the end of the round |
| AC10 | an Order question | the tiles appear | the bank contains every sentence tile plus 1 (beginner) or 2 (intermediate) decoys, shuffled |
| AC11 | an Order question | they arrange the tiles in the correct order and press Check | it is marked correct (decoys left in the bank) |
| AC12 | a Picture question | the board loads | 4 images and 4 Māori chips appear, and drag behaviour matches Match |
| AC13 | a Mixed round | it plays | questions come from more than one mode |
| AC14 | a round's 10th question is answered (and re-queues done) |: | the results screen shows `score / 10`, XP earned (10/5/0 per question + 20 bonus) and the streak |
| AC15 | a learner with `last_active_date` = yesterday | they complete a round | `current_streak` increases by 1 |
| AC16 | a learner with `last_active_date` 3 days ago | they view Home | the streak shows 0; after completing a round it shows 1 |
| AC17 | a learner closes the tab mid-round after question 4 | they return to Home | "Resume round" appears and resumes at question 5 with prior results intact |
| AC18 | a learner has answered all 80 beginner items correctly at least once | they finish the round | `beginner_completed_at` is set, an unlock message shows and Intermediate becomes playable |
| AC19 | a learner on Progress |: | their last 20 completed rounds appear with date, level, mode, score and XP |
| AC20 | a learner on Account | they confirm "Delete my account and data" | their auth user and all rows are deleted, and they are signed out to the landing page |
| AC21 | anyone | they open `#/privacy` | the privacy page renders without sign-in |
| AC22 | a PR to `main` | CI runs | lint, type-check, unit tests and build all run, and failure blocks merge (with branch protection) |
| AC23 | a PR is merged to `main` | deploy runs | migrations are pushed to Supabase, then the site is published to the Pages URL |
| AC24 | a phone at 360px width | they play every mode by touch | everything is usable with no horizontal scroll |
| AC25 | user A is signed in | they query user B's rows via the API | no rows are returned (RLS) |

## 11. Domain Model

### Entities
| Entity | Definition | Spec Path | Status |
|---|---|---|---|
| Learner | A signed-in user (auth user + profile) | specs/domain/definitions/learner.md | new |
| Item | A unit of content: Word or Sentence | specs/domain/definitions/item.md | new |
| Level | Beginner or Intermediate difficulty tier | specs/domain/definitions/level.md | new |
| Mode | Exercise style: Match, Translate, Order, Picture, Mixed | specs/domain/definitions/mode.md | new |
| Round | A 10-question session in one level and mode | specs/domain/definitions/round.md | new |
| Question | One exercise within a round (may cover several items, e.g. boards) | specs/domain/definitions/question.md | new |
| ItemProgress | A learner's attempt and mastery record for an item | specs/domain/definitions/item-progress.md | new |

### Relationships
```text
Learner 1──* Round 1──* Question *──* Item
Learner 1──* ItemProgress *──1 Item
Item *──1 Level      Round *──1 Level      Round *──1 Mode
```

### Glossary
| Term | Definition | First Defined In |
|---|---|---|
| Ako | To learn / to teach (reciprocal learning); the app name | this spec |
| Te reo Māori | The Māori language | this spec |
| Kupu | Word | this spec |
| Macron (tohutō) | Long-vowel mark: ā ē ī ō ū | this spec |
| Learned item | An item answered correctly at least once (`first_correct_at` set) | this spec |
| First try / Retry / Missed | Question result categories driving XP (10/5/0) | this spec |
| Re-queue | Replaying a missed question at the end of a round | this spec |
| Decoy | A plausible wrong tile in Order mode | this spec |
| Board | A multi-pair question (Match: 5 pairs, Picture: 4 pairs) | this spec |
| Streak | Consecutive local days with ≥ 1 completed round | this spec |

### Bounded Contexts
- **Learning** (content, rounds, marking, modes)
- **Progress** (item progress, XP, streak, history, unlock)
- **Identity** (auth, profile, privacy, account deletion)

## 12. Specs Directory Changes

```text
Before:                     After:
specs/                      specs/
└── INDEX.md                ├── INDEX.md                (+ ako-poc entry)
                            └── domain/
                                ├── glossary.md
                                └── definitions/
                                    ├── learner.md, item.md, level.md, mode.md
                                    ├── round.md, question.md, item-progress.md
```

| Path | Action | Description |
|---|---|---|
| specs/INDEX.md | modify | Register ako-poc spec |
| specs/domain/glossary.md | create | Glossary from §11 |
| specs/domain/definitions/*.md | create | One file per entity in §11 |

## 13. Components
*New components will be scaffolded during implementation. The SDD `fullstack-typescript` tech pack (Node/K8s/Helm) does not fit a static SPA with Supabase, so components are scaffolded manually.*

| Component | Type | Settings | Purpose |
|---|---|---|---|
| ako-webapp | webapp | path: `/` (repo root); framework: react+vite+ts; router: hash; base: `/language-learning-website/` | The SPA |
| ako-database | database | path: `supabase/`; provider: supabase; project_ref: `zmdbimnvxpbmnctqefcu`; migrations: `supabase/migrations` | Schema, RLS, triggers, RPC |
| ako-cicd | cicd | path: `.github/workflows/`; ci: pull_request→main; deploy: push→main (migrate then pages) | Checks + deploy |

Modified components: none (greenfield).

## 14. System Analysis

### Inferred Requirements
- Tap-to-move as an alternative to drag in Order, plus keyboard support everywhere (accessibility, easier on mobile).
- HashRouter + PKCE because GitHub Pages lacks SPA rewrites.
- `delete_my_account()` security-definer RPC, because deleting an auth user is impossible with the anon key otherwise.
- Retry/backoff for writes, needed to make "resume" and streaks reliable on flaky mobile networks.
- A "content not yet reviewed by a fluent speaker" note, since content is authored by non-speakers.

### Gaps & Assumptions
- Supabase built-in email sending is heavily rate-limited (a few emails per hour). That's fine for the PoC, but a public launch with email/password needs custom SMTP.
- The Google OAuth consent screen will show the `*.supabase.co` domain. That's acceptable for the PoC.
- Branch protection on `main` must be enabled by an org admin (it can't be done from code).

### Dependencies
See §17.

## 15. Testing Strategy

**Unit tests only for the PoC** (user decision, S23). Vitest, run in CI.

### Unit Tests
| Test | Covers |
|---|---|
| marking.test.ts | normalisation (case, punctuation, whitespace, articles, NFC), multiple accepted answers, typo tolerance thresholds (≤8 chars → 1, longer → 2), rejection of clearly wrong answers | AC8 |
| roundGenerator.test.ts | 10 questions; unlearned prioritised (≤7); no duplicates; Match boards = 5 words; Picture boards = 4 image words; Order only sentences; Mixed uses >1 mode; deterministic with seeded rng | AC5, AC12, AC13 |
| orderCheck.test.ts | correct order, altOrders, wrong order, decoy present = wrong, decoy count per level | AC10, AC11 |
| boardResult.test.ts | first/retry/missed classification; reveal after 2 wrong drops | AC6, AC7 |
| xp.test.ts | 10/5/0 per question, +20 bonus, re-queued = 0 | AC14 |
| streak.test.ts | same day, yesterday, gap, first-ever, longest tracking, display rule, month/year boundaries | AC15, AC16 |
| unlock.test.ts | incomplete vs complete beginner (all 80 items) | AC18 |
| roundState.test.ts | re-queue once; resume from serialized state; invalid state detection | AC9, AC17 |
| content.test.ts | 60/40 words, 20/20 sentences; unique ids; required fields; tiles join ≈ mi; decoys ∉ tiles; image counts (≥30 B, ≥20 I); valid emoji/svg refs | FR2 |

### Integration Tests
None for the PoC (deferred).

### E2E Tests
None for the PoC (deferred). AC2, AC3, AC20, AC22–AC25 are verified manually per `docs/SETUP.md` checklist.

### Test Data
Seeded RNG; small fixture content set in `src/game/__fixtures__/`.

## 16. Migration / Rollback
- Initial migration `supabase/migrations/20261009000000_init.sql` creates everything in §5.4. Rollback is a manual SQL drop of the 3 tables, trigger functions and RPC (documented in `docs/SETUP.md`).
- Site rollback: revert the PR on `main`, which redeploys the previous build.

## 17. Dependencies

### External
- Supabase project `zmdbimnvxpbmnctqefcu` (Auth: Google provider + email; Postgres).
- Google Cloud OAuth client (Web), with the redirect URI `https://zmdbimnvxpbmnctqefcu.supabase.co/auth/v1/callback`.
- GitHub Pages (Source: GitHub Actions) on `pattern-labs-foundation/language-learning-website`.
- npm: react, react-dom, react-router, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @supabase/supabase-js; dev: vite, @vitejs/plugin-react, typescript, vitest, eslint, typescript-eslint, supabase (CLI in CI via `supabase/setup-cli`).

### Manual setup by the user (documented in `docs/SETUP.md`)
1. Supabase: copy the Project URL and publishable/anon key. Set Site URL + redirect URLs.
2. Google Cloud: create the OAuth client and paste its ID and secret into Supabase → Auth → Providers → Google.
3. GitHub: Settings → Pages → Source: GitHub Actions. Add variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` `SUPABASE_PROJECT_REF` and `SUPABASE_DB_HOST`, and secret `SUPABASE_DB_PASSWORD`. Enable branch protection on `main` requiring the `ci` check.

## 18. Out of Scope
Advanced level; audio/listening mode; English → Māori typing; native mobile apps; custom domain; component/integration/E2E tests; server-side validation or anti-cheat; leaderboards/social; content editing UI or content stored in Supabase; Supabase GitHub integration / preview branches; offline-first/PWA; topic-based navigation; UI translation into Māori; custom SMTP.

## 19. Open Questions

| # | Question | Status | Blocker For |
|---|---|---|---|
| O1 | Include "forgot password" for email/password? | ASSUMED: yes (standard for email/password auth) | FR1.4 |
| O2 | Fluent-speaker review of generated content before public promotion? | DEFERRED: post-PoC; in-app note shown meanwhile | FR2.7 |
| O3 | Who enables branch protection on `main`? | ASSUMED: user/org admin, per SETUP.md | FR12.2 |
| O4 | Word/sentence split per level | ASSUMED: words 60 B / 40 I; sentences 20 B / 20 I | FR2.2 |
| O5 | How "retry once" (S18) applies to drag boards with "bounce back" (S6b) | ASSUMED: per-word reveal after 2 wrong drops; board result first/retry/missed | FR5.3–5.5 |
| O6 | Tap-to-move alternative to drag | ASSUMED: yes (Order bank/row; keyboard for all) | FR7.2 |
| O7 | Does Translate include sentences or only words? | ASSUMED: both | FR6.4 |
| O8 | Board sizes (Match 5 pairs, Picture 4) | ASSUMED | FR5.1, FR8.1 |
| O9 | Unlearned-item priority (≤7 of 10) | ASSUMED | FR4.3 |

No OPEN questions remain.

## 20. Requirements Discovery

### Initial Request (verbatim summary)
Spec-driven development. App hosted on GitHub Pages, Supabase for auth and data storage. A simple Māori language learning app with multiple selectable styles: match words, write the English translation, sentence ordering (drag given words into order), and a fourth option. Everything must be easy drag and drop. Possibly Flutter. Logic in the frontend (PoC). The database stores state for each logged-in person.

### Solicitation Phase
| # | Question | Answer | Source |
|---|---|---|---|
| S1 | Who is the app mainly for? | Anyone who finds it on Google: a public app | User |
| S2 | What level is it aimed at? | Beginner to intermediate. Advanced is future, not the PoC. Images can be tagged to words | User |
| S3 | Who supplies words, sentences and images? | Dev team generates them: 100 words, 40 sentences. Images up to dev team | User |
| S3a | ↳ Image approach | Emoji where suitable plus simple original SVG icons (no photos or painted illustrations for the PoC) | Dev team (delegated) |
| S4 | How is content organised? | By level: beginner → intermediate | User |
| S5 | Where does content live? | Bundled JSON for the PoC | User |
| S6 | Is the Match layout (Māori words dragged onto shuffled English) right? | Yes | User |
| S6b | Wrong Match drop: bounce back, or count as mistake and show answer? | Bounces back | User |
| S7 | Translate marking strictness (ignore case/punctuation, multiple answers, small typos)? | Agree with all | User |
| S8 | Decoy tiles in Order mode? | Yes, good idea | User |
| S9 | Fourth mode? | Picture mode | User |
| S9a | ↳ Distinguish Match vs Picture | Match = Māori↔English text, Picture = Māori↔image | Dev team (stated, not objected) |
| S10 | Session structure: level + mode, 10-question round, score; Mixed mode? | Yes. Intermediate locked until beginner done. Also: work on feature branches; merge PR into main deploys | User |
| S11 | What counts as completing Beginner? | Every beginner item answered correctly at least once | User |
| S12 | Login methods? | Google sign-in | User |
| S12b | Guest play allowed? | Email/password as the alternative to Google. Must sign in to play | User |
| S13 | What to save per user (history, streak, XP, resume, or minimal)? | Yes to all (interpreted as history, streak, XP, resume) | User |
| S14 | Flutter vs lighter web stack? | Must be mobile friendly | User |
| S14b | Mobile-friendly site vs app-store apps? | Mobile-friendly website is enough; dev team decides the stack → React + TS + Vite + dnd-kit | User / dev team (delegated) |
| S15 | GitHub repo? | https://github.com/pattern-labs-foundation/language-learning-website | User |
| S16 | Local clone location? | C:\Users\benja\source\repos\language-learning-website | User |
| S17 | Translate direction? | "Māori is what I want to teach", interpreted as Māori shown → type English (per original request) | User / dev team interpretation |
| S18 | Wrong answer: show answer, or retry once then show? | Retry once, then show | User |
| S19 | XP (10/5, +20 round) and streak (≥1 round per local day) rules OK? | OK | User |
| S20 | Existing Supabase project? | Created during session: ref `zmdbimnvxpbmnctqefcu`. Advised not to connect Supabase GitHub integration | User |
| S21 | Default Pages URL or custom domain? | Default for now (PoC) | User |
| S22 | PR checks blocking merge? | Yes | User |
| S23 | Testing scope? | Unit tests for now | User |
| S24 | Name and look? | Look: Māori and European blend | User |
| S24b | App name? | "Come up with something smart and in Māori" → **Ako** | User / dev team (delegated) |
| S25 | Privacy page + delete account? | Yes | User |

### User Feedback & Corrections
| When | Feedback |
|---|---|
| 2026-10-09 | "Ask me one by one": questions switched from a batch to one per message. |
| 2026-10-09 | "Māori is what I want to teach. Don't be silly." Translate direction confirmed as Māori → English. |
| 2026-10-09 | "You can answer all questions, do not wait for me." Remaining gaps resolved as ASSUMED (§19); spec approved by delegation. |
| 2026-10-09 | "Once sorted, hand over for implementation." |
| 2026-10-09 | "The very first thing I want is the pipelines and a page deploying and hooked up to sign in and Supabase. Then start the app build." Plan Phase 1 is a walking skeleton (CI, deploy, migrations, auth, signed-in placeholder Home), shipped as its own PR before the app build. |

### Open Questions (BLOCKING)
None OPEN. See §19.

## 21. References
- Supabase Auth (Google): https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- dnd-kit: https://docs.dndkit.com
- GitHub Pages with Actions: https://docs.github.com/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
