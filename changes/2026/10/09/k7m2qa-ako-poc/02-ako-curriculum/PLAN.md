---
title: Ako v2: Full Learning Path - Implementation Plan
change_id: ako-poc-2
spec: ./SPEC.md
status: approved
created: 2026-10-09
---

# Implementation Plan: Ako v2

Spec: [SPEC.md](./SPEC.md). Build on the existing code; do not rewrite working PoC parts unnecessarily.

## Delivery
Three milestones, each a separate branch and PR so the live site improves step by step:

| Milestone | Branch | Base | Phases |
|---|---|---|---|
| M1: Path, Learn, unit check | `feature/curriculum` (spec already committed) | `main` | 1-4 |
| M2: New modes, Review, reference screens | `feature/curriculum-m2` | M1 branch | 5-7 |
| M3: Advanced level + full content | `feature/curriculum-m3` | M2 branch | 8-9 |

Commit per phase. Lint, typecheck, test and build must pass before every commit. Do not push.

## Phase 1: Content restructure
Unit/Level types (`advanced` added), `src/content/units/*.json`, loader, assign all 140 PoC items (same ids) to the 16 Beginner/Intermediate units, add new items so each unit has 10-14 words and 5-7 sentences. Grammar notes `src/content/grammar/*.md` for these 16 units. Content tests (§7).

## Phase 2: Migration + data layer
`supabase/migrations/20261010000000_curriculum.sql` (§5.2; check real constraint names). `unitProgressRepo.ts`; extend progressRepo with SRS fields. Keep the save queue/retry patterns.

## Phase 3: Logic
`unitUnlock.ts` (with PoC migration rule), `unitRound.ts` (practice + check), `grammarMarkdown.ts`. Tests first.

## Phase 4: UI
Path Home, Unit screen, Learn deck, grammar card, unit practice/check rounds, results celebration and missed list, bottom tab bar on mobile, Free Practice entry. Level type extended everywhere (Free Practice for unlocked levels).
**M1 done**: report, wait for PR.

## Phase 5: Write + Fill the gap
`macronMarking.ts`, macron keyboard row component, Write mode; `gapGenerator.ts`, Fill-the-gap mode (dnd-kit + tap). Add to Mixed and the mode picker. Tests.

## Phase 6: SRS Review
`srs.ts`, schedule updates on every round completion (per item, boards per word), Review round and "Review (N due)" badge, initial `due_on` backfill on first load.

## Phase 7: Reference + stats
Grammar index, Pronunciation screen, Glossary with accent-insensitive search, Progress stats (§FR10). Lazy-load reference screens.
**M2 done**: report.

## Phase 8: Advanced content
6 Advanced units (§FR1.5) with words, sentences and grammar notes. Accuracy over variety; prefer well-attested forms. Content tests updated for totals (≥ 270 words, ≥ 135 sentences).

## Phase 9: Polish
Accessibility pass, bundle check (≤ 250 KB gz JS), README update, specs/domain updates (Unit, ReviewSchedule, UnitProgress), indexes, workflow.yaml item 02 to impl complete / review ready.
**M3 done**: report.
