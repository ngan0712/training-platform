-- 0009_exercise_submissions.sql
-- Append-only: never edit this file after merging to main.

create table if not exists public.exercise_submissions (
  id           uuid        primary key default gen_random_uuid(),
  exercise_id  uuid        not null references public.exercises(id) on delete cascade,
  user_id      uuid        not null references public.users(id) on delete cascade,
  status       text        not null default 'draft'
                             check (status in ('draft', 'submitted', 'reviewed')),
  outcome      text        null check (outcome in ('pass', 'fail')),
  file_path    text        null,
  feedback     text        null,
  reviewer_id  uuid        null references public.users(id) on delete set null,
  submitted_at timestamptz null,
  reviewed_at  timestamptz null,
  updated_at   timestamptz not null default now(),
  unique (exercise_id, user_id)
);

alter table public.exercise_submissions enable row level security;

-- Learners may read only their own submissions.
create policy "es_select_own" on public.exercise_submissions
  for select
  using (user_id = auth.uid());

-- Admins may read all submissions.
create policy "es_select_admin" on public.exercise_submissions
  for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Learners may insert their own submissions.
create policy "es_insert_own" on public.exercise_submissions
  for insert
  with check (user_id = auth.uid());

-- Learners may update their own submissions (draft saves and submit).
-- State-machine enforcement is done at the application layer.
create policy "es_update_own" on public.exercise_submissions
  for update
  using (user_id = auth.uid());

-- Admins may update any submission (review, revert to draft).
create policy "es_update_admin" on public.exercise_submissions
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
