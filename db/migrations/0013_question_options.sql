-- 0013_question_options.sql
-- Options for single_choice, multi_choice, and dropdown questions.
-- Append-only: never edit this file after merging to main.

create table if not exists public.exercise_question_options (
  id          uuid  primary key default gen_random_uuid(),
  question_id uuid  not null references public.exercise_questions(id) on delete cascade,
  label       text  not null,
  value       text  not null,
  "order"     int   not null
);

alter table public.exercise_question_options enable row level security;

create policy "eqo_select_authenticated" on public.exercise_question_options
  for select using (auth.uid() is not null);

create policy "eqo_admin_insert" on public.exercise_question_options
  for insert with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "eqo_admin_update" on public.exercise_question_options
  for update using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "eqo_admin_delete" on public.exercise_question_options
  for delete using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
