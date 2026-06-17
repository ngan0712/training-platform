-- 0002_modules.sql
-- Append-only: never edit this file after merging to main.

create table if not exists public.modules (
  id                  uuid        primary key default gen_random_uuid(),
  week_number         int         not null,
  "order"             int         not null,
  title               text        not null,
  description         text        not null default '',
  required_for_track  text        not null default 'both'
                        check (required_for_track in ('both', 'non_tech_only')),
  created_at          timestamptz not null default now()
);

alter table public.modules enable row level security;

-- All authenticated users may read every module.
create policy "modules_select_authenticated" on public.modules
  for select
  using (auth.uid() is not null);

-- Admins may insert and update modules.
create policy "modules_admin_insert" on public.modules
  for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "modules_admin_update" on public.modules
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
