-- Ako: initial schema (profiles, item_progress, rounds), RLS, triggers and the
-- account-deletion RPC. See changes/2026/10/09/k7m2qa-ako-poc/01-ako-poc/SPEC.md section 5.4.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  xp integer not null default 0 check (xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_date date,
  beginner_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.item_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  attempt_count integer not null default 0,
  correct_count integer not null default 0,
  first_correct_at timestamptz,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level text not null check (level in ('beginner', 'intermediate')),
  mode text not null check (mode in ('match', 'translate', 'order', 'picture', 'mixed')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  state jsonb not null,
  score integer,
  total integer not null default 10,
  xp_earned integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index rounds_one_in_progress on public.rounds (user_id) where status = 'in_progress';
create index rounds_user_completed on public.rounds (user_id, completed_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.item_progress enable row level security;
alter table public.rounds enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert policy: rows are created only by the on_auth_user_created trigger.
-- No delete policy: account deletion goes through delete_my_account().

create policy "item_progress_select_own" on public.item_progress
  for select to authenticated
  using (auth.uid() = user_id);

create policy "item_progress_insert_own" on public.item_progress
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "item_progress_update_own" on public.item_progress
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "item_progress_delete_own" on public.item_progress
  for delete to authenticated
  using (auth.uid() = user_id);

create policy "rounds_select_own" on public.rounds
  for select to authenticated
  using (auth.uid() = user_id);

create policy "rounds_insert_own" on public.rounds
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "rounds_update_own" on public.rounds
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "rounds_delete_own" on public.rounds
  for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Account deletion RPC
-- ---------------------------------------------------------------------------

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from anon, public;
grant execute on function public.delete_my_account() to authenticated;
