-- 0007_exercises.sql
-- Append-only: never edit this file after merging to main.

create table if not exists public.exercises (
  id            uuid        primary key default gen_random_uuid(),
  module_id     uuid        not null references public.modules(id) on delete cascade,
  type          text        not null check (type in ('qa', 'md_upload')),
  title         text        not null,
  prompt        text        not null default '',
  is_compulsory boolean     not null default true,
  "order"       int         not null,
  created_at    timestamptz not null default now()
);

alter table public.exercises enable row level security;

-- All authenticated users may read every exercise.
create policy "exercises_select_authenticated" on public.exercises
  for select
  using (auth.uid() is not null);

-- Admins may insert and update exercises.
create policy "exercises_admin_insert" on public.exercises
  for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "exercises_admin_update" on public.exercises
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "exercises_admin_delete" on public.exercises
  for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
