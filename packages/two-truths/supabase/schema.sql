-- Tables owned by the Two Truths & a Lie game.
-- Run ../../../supabase/storage.sql first (it creates the shared photos bucket).
-- Supabase > SQL Editor > New query > paste > Run. Safe to re-run.

-- A round is created first, then players are added to it.
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  name text,
  -- submission ids in the order they were played, filled in when the round is played
  player_ids uuid[] not null default '{}',
  shuffled boolean not null default false,
  lies_spotted int not null default 0,
  lies_guessed int not null default 0,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references public.rounds (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  photo_url text not null,
  -- [{ "text": "...", "truth": true|false }, x3]
  statements jsonb not null,
  -- [{ "url": "...", "caption": "...", "statement": null|0|1|2 }, up to 4]
  bonus jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint three_statements check (
    jsonb_typeof(statements) = 'array' and jsonb_array_length(statements) = 3
  ),
  constraint few_bonus check (
    jsonb_typeof(bonus) = 'array' and jsonb_array_length(bonus) <= 4
  )
);

-- For databases created before rounds owned their players.
alter table public.rounds add column if not exists name text;
alter table public.rounds add column if not exists host_code text;
alter table public.submissions
  add column if not exists round_id uuid references public.rounds (id) on delete cascade;

create index if not exists rounds_created_at_idx on public.rounds (created_at desc);
create index if not exists submissions_round_id_idx on public.submissions (round_id);

-- The anon key ships in the browser, so host_code must never be selectable through
-- the API. Drop the blanket select grant and re-grant every column except that one.
revoke select on public.rounds from anon, authenticated;
grant select (id, name, player_ids, shuffled, lies_spotted, lies_guessed, created_at, finished_at)
  on public.rounds to anon, authenticated;

-- Checking the code happens inside the database, so the value never leaves it.
create or replace function public.round_host_code_ok(p_round uuid, p_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rounds
    where id = p_round
      and host_code is not null
      and upper(host_code) = upper(btrim(p_code))
  );
$$;

grant execute on function public.round_host_code_ok(uuid, text) to anon, authenticated;

-- Rounds made before host codes existed stay open to everyone.
create or replace function public.round_needs_host_code(p_round uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select host_code is not null from public.rounds where id = p_round), false);
$$;

grant execute on function public.round_needs_host_code(uuid) to anon, authenticated;

alter table public.rounds enable row level security;
alter table public.submissions enable row level security;

-- Anyone with the link can read and add. Nobody can delete from the app
-- (do that from the Supabase dashboard if needed).
do $$ begin
  create policy "anyone can read rounds" on public.rounds for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anyone can start a round" on public.rounds for insert with check (true);
exception when duplicate_object then null; end $$;
-- Needed so a round can be closed out with its final score.
do $$ begin
  create policy "anyone can finish a round" on public.rounds for update using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "anyone can read submissions" on public.submissions for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "anyone can add a submission" on public.submissions for insert with check (true);
exception when duplicate_object then null; end $$;
