---
title: Ako: Māori Language Learning PoC: Implementation Plan
change_id: ako-poc-1
spec: ./SPEC.md
status: approved
created: 2026-10-09
---

# Implementation Plan: Ako PoC

The spec is the source of truth: [SPEC.md](./SPEC.md). Section references (§, FR, AC) point into it.

## Branching & delivery

| PR | Branch | Base | Phases | Goal |
|---|---|---|---|---|
| PR 1 | `feature/ako-poc-spec` (spec, already committed) → continue on it | `main` | 0, 1 | **Walking skeleton**: pipelines + deployed page + Supabase sign-in working end-to-end |
| PR 2 | `feature/app-build` (branched from PR 1 branch) | `main` (after PR 1 merges) | 2–7 | The actual app |

Commit after each phase with a conventional message (`feat:`, `ci:`, `chore:`, `test:`, `docs:`). **Do not push** (the user pushes and opens PRs).

---

## Phase 0: Project scaffold
- `npm create vite@latest` equivalent (React + TS) **at the repo root** (keep the existing README, `changes/`, `sdd/`, `specs/`).
- Deps: `react`, `react-dom`, `react-router` (v7, use `HashRouter`), `@supabase/supabase-js`. Dev: `vitest`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `@vitejs/plugin-react`.
- `vite.config.ts`: `base: '/language-learning-website/'`, vitest config (`environment: 'node'` for game logic).
- `package.json` scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `lint`, `typecheck` (`tsc -b --noEmit` or equivalent), `test` (`vitest run`).
- `.env.example` with `VITE_SUPABASE_URL=https://zmdbimnvxpbmnctqefcu.supabase.co` and `VITE_SUPABASE_ANON_KEY=`. `.gitignore` covers `.env`, `.env.local`, `node_modules`, `dist`, `supabase/.temp`.
- `index.html`: title "Ako: Learn te reo Māori", meta description, Open Graph tags, `lang="en"`, Google Fonts (Fraunces + Inter).
- Design tokens in `src/styles/tokens.css` (§5.6) and `global.css`.
- **Done when:** `npm run lint && npm run typecheck && npm test && npm run build` all pass (add one trivial test so Vitest passes).

## Phase 1: Walking skeleton (pipelines + deploy + auth) → PR 1
1. **Supabase**
   - `supabase/config.toml` (from `supabase init`, or minimal hand-written with `project_id = "language-learning-website"`).
   - `supabase/migrations/20261009000000_init.sql`: the **full** schema from §5.4 (profiles, item_progress, rounds, indexes, RLS + policies, `handle_new_user` trigger, `set_updated_at` trigger, `delete_my_account()` RPC with grants). Security-definer functions use `set search_path = ''` and fully-qualified names.
2. **Auth**
   - `src/data/supabaseClient.ts`: `createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } })`. If env vars are missing, export `null` and render a "Configuration missing" screen.
   - `src/auth/AuthProvider.tsx` (session context, `onAuthStateChange`), `RequireAuth.tsx`.
   - OAuth `redirectTo`: `window.location.origin + import.meta.env.BASE_URL`. PKCE returns `?code=…` in the query string, and supabase-js exchanges it automatically. After the session is established, clean the query string with `history.replaceState` and navigate to `#/home`.
   - Landing `#/`: brand header (Ako + tagline + one original kōwhaiwhai-style SVG border), "Continue with Google" button, email/password sign-in + sign-up tabs, "Forgot password?" link. Errors are shown inline. Shows a "Check your email" message after sign-up.
   - `#/reset-password`: handles the `PASSWORD_RECOVERY` event and calls `updateUser({ password })`.
   - `#/home` (protected placeholder): "Kia ora, {display_name}". It reads `profiles` to prove the DB, trigger and RLS work, and shows XP 0 and streak 0. Includes a sign-out button.
   - `#/privacy`: full privacy page content (FR10.1).
   - `#/account`: sign out + Delete account (FR10.2), already wired to the RPC.
3. **CI** `.github/workflows/ci.yml`: on `pull_request` to `main` (and `workflow_dispatch`). Job id **`ci`**: checkout, setup-node 22 with npm cache, `sh scripts/check-no-em-dash.sh` (no em dashes anywhere), `npm ci`, lint, typecheck, test, build (with the `VITE_*` vars from `vars.` context; the build must succeed even if they are empty).
4. **Deploy** `.github/workflows/deploy.yml`: on `push` to `main` + `workflow_dispatch`. `permissions: contents: read, pages: write, id-token: write`. `concurrency: group: pages, cancel-in-progress: false`.
   - Job `migrate`: `supabase/setup-cli@v1`, then `supabase link --project-ref ${{ vars.SUPABASE_PROJECT_REF }} -p "$SUPABASE_DB_PASSWORD"` and `supabase db push -p "$SUPABASE_DB_PASSWORD"`, with env `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` from secrets.
   - Job `build`: (needs migrate) checks + `npm run build` with `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` from `vars`, copy `dist/index.html` → `dist/404.html`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` (path `dist`).
   - Job `deploy`: (needs build) `environment: github-pages`, `actions/deploy-pages@v4`.
5. **`docs/SETUP.md`**: exact click-by-click guide (§17 manual setup):
   - Supabase: API keys location; Auth → URL Configuration: Site URL `https://pattern-labs-foundation.github.io/language-learning-website/`, Redirect URLs that URL plus `http://localhost:5173/language-learning-website/`; Email provider on.
   - Google Cloud: OAuth consent screen (External, app name Ako, scopes email/profile/openid, privacy link to `…/#/privacy`), OAuth client type Web, Authorised JS origins `https://pattern-labs-foundation.github.io` and `http://localhost:5173`, redirect URI `https://zmdbimnvxpbmnctqefcu.supabase.co/auth/v1/callback`, then paste the ID and secret into Supabase → Auth → Providers → Google.
   - Supabase access token (Account → Access Tokens) and DB password for CI.
   - GitHub: Pages source = GitHub Actions; repo variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_PROJECT_REF=zmdbimnvxpbmnctqefcu`; secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`; branch protection on `main` requiring PR + the `ci` check.
   - Local dev: copy `.env.example` → `.env.local`, `npm run dev`.
   - Manual verification checklist (AC2, AC3, AC20–AC23, AC25) and rollback SQL.
6. Update `README.md`: what Ako is, stack, scripts, link to SETUP.md and the spec.
- **Done when:** all local checks pass; workflows are valid YAML; app runs locally with "Configuration missing" if there is no `.env.local`. Commit, then **stop and report** before Phase 2 work starts on the new branch.

## Phase 2: Content (`feature/app-build`)
- `src/game/types.ts` (§5.3 types), `src/content/content.json` with **60 B / 40 I words and 20 B / 20 I sentences**, correct macrons, multiple accepted English answers, `tiles`, `decoys`, `altOrders` where Māori allows; ≥30 B / ≥20 I words with `image` (prefer emoji; original simple SVG icons in `src/content/icons/` only where no emoji fits).
- Use well-established, standard modern te reo Māori (Te Aka / Te Taura Whiri conventions). Prefer common, unambiguous vocabulary. Sentences use clear beginner patterns (e.g. *Kei te pai ahau*, *He kurī tēnā*, *Kei hea te wharepaku?*, *Ko Mere tōku ingoa*, *E hia ō tau?*) and slightly longer intermediate ones (tense markers *i / kei te / ka / e … ana*, possessives, locatives).
- `src/content/content.ts`: typed loader + helpers.
- `content.test.ts` (§15).

## Phase 3: Game logic (pure, TDD)
- `levenshtein.ts`, `marking.ts`, `orderCheck.ts`, `boardResult.ts`, `xp.ts`, `streak.ts`, `unlock.ts`, `roundGenerator.ts` (seeded rng), `roundState.ts` (re-queue, serialise/deserialise, validate). All tests in §15 written first.

## Phase 4: Data layer
- `data/retry.ts` (3× backoff + pending queue), `profileRepo.ts`, `progressRepo.ts`, `roundRepo.ts` (§6). Handle the unique-index conflict on insert (FR9.6). Toast system.

## Phase 5: UI: shell & screens
- App shell (header with XP/streak, nav: Home, Progress, Account), Home (level cards, lock, N/80 progress, Resume), Mode picker, Results, Progress (last 20), "not yet reviewed by a fluent speaker" note in footer. Mobile-first, 360px.

## Phase 6: UI: the four modes + Mixed
- dnd-kit with `PointerSensor` (activation distance ~4px), `TouchSensor` (small delay ~100ms, tolerance 5), `KeyboardSensor`. Set `touch-action: none` on draggables.
- `Match.tsx` (5 pairs, bounce-back, reveal after 2), `Picture.tsx` (2×2), `Translate.tsx` (input + Check/Enter, retry, reveal), `Order.tsx` (sortable answer row + bank, tap-to-move, decoys), Mixed dispatcher. Feedback: "Ka pai!" / "Not quite, try again". Respect reduced motion.
- Round controller: progress bar, retry/reveal flow, re-queue, save state after every question, completion (XP, streak, item progress, unlock, history) → Results.

## Phase 7: Polish & verification
- Original kōwhaiwhai-inspired SVG pattern components; unlock celebration; accessibility pass (contrast, focus states, `lang="mi"` on Māori text); bundle size check (≤250 KB gz JS); `specs/domain/glossary.md` + `specs/domain/definitions/*.md` (§12); update `specs/INDEX.md` and `changes/INDEX.md`.
- Final: lint, typecheck, test, build all green. Commit and report.
