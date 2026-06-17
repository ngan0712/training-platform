-- 0005_groups.sql
-- Append-only: never edit this file after merging to main.

create table if not exists public.groups (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  project_idea  text        not null default '',
  created_at    timestamptz not null default now()
);

alter table public.groups enable row level security;

-- All authenticated users may read every group.
create policy "groups_select_authenticated" on public.groups
  for select
  using (auth.uid() is not null);

-- Any authenticated user may insert a group (they will then add themselves as a member).
create policy "groups_insert_authenticated" on public.groups
  for insert
  with check (auth.uid() is not null);

-- Admins may insert and update any group.
create policy "groups_admin_insert" on public.groups
  for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "groups_admin_update" on public.groups
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
