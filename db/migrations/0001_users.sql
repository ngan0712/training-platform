-- 0001_users.sql
-- Creates the users table and RLS policies for the auth unit.
-- Append-only: never edit this file after merging to main.

create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  name       text not null default '',
  role       text not null default 'learner' check (role in ('learner', 'admin')),
  track      text check (track in ('tech', 'non_tech')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- A user may read their own row.
create policy "users_select_own" on public.users
  for select
  using (id = auth.uid());

-- Admins may read all rows (role stored in JWT app_metadata to avoid recursion).
create policy "users_select_admin" on public.users
  for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- A user may update only their own name.
create policy "users_update_own_name" on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());
-- INSERT is done exclusively via service role at the OAuth callback; no INSERT policy needed.
