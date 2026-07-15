-- 0018_app_settings.sql
-- Append-only: never edit this file after merging to main.

-- Singleton table for platform-wide settings admins can adjust at runtime,
-- starting with the group formation deadline (previously hardcoded in
-- lib/domain/cutoffs.ts).
create table if not exists public.app_settings (
  id                        boolean      primary key default true,
  group_submission_cutoff  timestamptz  not null,
  updated_at                timestamptz  not null default now(),
  updated_by                uuid         references public.users(id),

  constraint app_settings_singleton check (id)
);

insert into public.app_settings (id, group_submission_cutoff)
values (true, '2026-07-03T23:59:59+08:00')
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

-- All authenticated users may read the settings (learner pages need the cutoff).
create policy "app_settings_select_authenticated" on public.app_settings
  for select
  using (auth.uid() is not null);

-- Only admins may update settings.
create policy "app_settings_admin_update" on public.app_settings
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
