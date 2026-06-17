-- 0008_exercise_questions.sql
-- Append-only: never edit this file after merging to main.

create table if not exists public.exercise_questions (
  id          uuid  primary key default gen_random_uuid(),
  exercise_id uuid  not null references public.exercises(id) on delete cascade,
  prompt      text  not null,
  ref_answer  text  null,
  "order"     int   not null
);

alter table public.exercise_questions enable row level security;

-- Learners can read questions but NOT the ref_answer column.
-- We enforce column-level restriction at the application layer (service client for admins).
create policy "eq_select_authenticated" on public.exercise_questions
  for select
  using (auth.uid() is not null);

-- Admins may insert, update, and delete questions.
create policy "eq_admin_insert" on public.exercise_questions
  for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "eq_admin_update" on public.exercise_questions
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "eq_admin_delete" on public.exercise_questions
  for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
