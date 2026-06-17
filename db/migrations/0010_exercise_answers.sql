-- 0010_exercise_answers.sql
-- Append-only: never edit this file after merging to main.

create table if not exists public.exercise_answers (
  id            uuid  primary key default gen_random_uuid(),
  submission_id uuid  not null references public.exercise_submissions(id) on delete cascade,
  question_id   uuid  not null references public.exercise_questions(id) on delete cascade,
  answer_text   text  not null check (char_length(answer_text) <= 5000),
  unique (submission_id, question_id)
);

alter table public.exercise_answers enable row level security;

-- Learners may read answers on their own submissions.
create policy "ea_select_own" on public.exercise_answers
  for select
  using (
    exists (
      select 1 from public.exercise_submissions s
      where s.id = submission_id and s.user_id = auth.uid()
    )
  );

-- Admins may read all answers.
create policy "ea_select_admin" on public.exercise_answers
  for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Learners may insert/update answers for their own submissions.
create policy "ea_insert_own" on public.exercise_answers
  for insert
  with check (
    exists (
      select 1 from public.exercise_submissions s
      where s.id = submission_id and s.user_id = auth.uid()
    )
  );

create policy "ea_update_own" on public.exercise_answers
  for update
  using (
    exists (
      select 1 from public.exercise_submissions s
      where s.id = submission_id and s.user_id = auth.uid()
    )
  );
