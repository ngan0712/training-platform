-- 0004_material_clicks.sql
-- Append-only: never edit this file after merging to main.

create table if not exists public.material_clicks (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.users(id) on delete cascade,
  material_id  uuid        not null references public.materials(id) on delete cascade,
  clicked_at   timestamptz not null default now(),
  unique (user_id, material_id)
);

alter table public.material_clicks enable row level security;

-- A learner may read only their own click records.
create policy "clicks_select_own" on public.material_clicks
  for select
  using (user_id = auth.uid());

-- Admins may read all click records.
create policy "clicks_select_admin" on public.material_clicks
  for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Any authenticated user may insert a click for themselves.
-- ON CONFLICT DO NOTHING is enforced at the query level (idempotent, first-click-wins).
create policy "clicks_insert_own" on public.material_clicks
  for insert
  with check (user_id = auth.uid());
