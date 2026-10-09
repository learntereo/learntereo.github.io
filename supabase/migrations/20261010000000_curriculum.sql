-- Ako v2: learning path. Adds unit_progress, spaced-repetition columns on
-- item_progress, and widens the rounds constraints for levels and path rounds.
-- See changes/2026/10/09/k7m2qa-ako-poc/02-ako-curriculum/SPEC.md section 5.2.
-- The init migration is never edited; everything here is additive.

-- ---------------------------------------------------------------------------
-- unit_progress
-- ---------------------------------------------------------------------------

create table public.unit_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  unit_id text not null,
  learned_at timestamptz,
  completed_at timestamptz,
  best_score integer check (best_score is null or best_score >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  primary key (user_id, unit_id)
);

alter table public.unit_progress enable row level security;

create policy "unit_progress_select_own" on public.unit_progress
  for select to authenticated
  using (auth.uid() = user_id);

create policy "unit_progress_insert_own" on public.unit_progress
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "unit_progress_update_own" on public.unit_progress
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "unit_progress_delete_own" on public.unit_progress
  for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Spaced repetition columns on item_progress
-- ---------------------------------------------------------------------------

alter table public.item_progress
  add column ease real not null default 2.5 check (ease >= 1.3 and ease <= 3.0),
  add column interval_days integer not null default 1 check (interval_days >= 1),
  add column due_on date,
  add column lapses integer not null default 0 check (lapses >= 0);

-- ---------------------------------------------------------------------------
-- rounds: Advanced level, path round modes and the unit a round belongs to.
-- The init migration declared these as inline checks, which Postgres names
-- rounds_level_check and rounds_mode_check.
-- ---------------------------------------------------------------------------

alter table public.rounds drop constraint if exists rounds_level_check;
alter table public.rounds add constraint rounds_level_check
  check (level in ('beginner', 'intermediate', 'advanced'));

alter table public.rounds drop constraint if exists rounds_mode_check;
alter table public.rounds add constraint rounds_mode_check
  check (mode in ('match', 'translate', 'order', 'picture', 'write', 'gap', 'mixed', 'review', 'unit_practice', 'unit_check'));

alter table public.rounds add column unit_id text;
