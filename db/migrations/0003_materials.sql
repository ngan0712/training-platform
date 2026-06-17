-- 0003_materials.sql
-- Append-only: never edit this file after merging to main.

create table if not exists public.materials (
  id            uuid        primary key default gen_random_uuid(),
  module_id     uuid        not null references public.modules(id) on delete cascade,
  "order"       int         not null,
  title         text        not null,
  url           text        not null,
  type          text        not null
                  check (type in ('doc', 'slides', 'reading', 'video', 'form')),
  is_compulsory boolean     not null default true,
  created_at    timestamptz not null default now()
);

alter table public.materials enable row level security;

-- All authenticated users may read every material.
create policy "materials_select_authenticated" on public.materials
  for select
  using (auth.uid() is not null);

-- Admins may insert and update materials.
create policy "materials_admin_insert" on public.materials
  for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "materials_admin_update" on public.materials
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
