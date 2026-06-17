-- 0015_quiz_attempts.sql
-- Append-only: never edit this file after merging to main.

create table if not exists public.quiz_attempts (
  id             uuid        primary key default gen_random_uuid(),
  quiz_id        uuid        not null references public.quizzes(id) on delete cascade,
  user_id        uuid        not null references public.users(id) on delete cascade,
  score_pct      integer     not null check (score_pct between 0 and 100),
  passed         boolean     not null,
  attempt_number integer     not null,
  submitted_at   timestamptz not null default now()
);

create index quiz_attempts_quiz_user_idx on public.quiz_attempts (quiz_id, user_id);

alter table public.quiz_attempts enable row level security;

-- Learners can read and insert their own attempts. Admins read all via service client.
create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select using (auth.uid() = user_id);

create policy "quiz_attempts_insert_own" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);

-- Attempt answers: one row per (attempt, question).
create table if not exists public.quiz_attempt_answers (
  id          uuid    primary key default gen_random_uuid(),
  attempt_id  uuid    not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid    not null references public.quiz_questions(id),
  option_id   uuid    not null references public.quiz_question_options(id),
  is_correct  boolean not null
);

alter table public.quiz_attempt_answers enable row level security;

create policy "quiz_attempt_answers_select_own" on public.quiz_attempt_answers
  for select using (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

create policy "quiz_attempt_answers_insert_own" on public.quiz_attempt_answers
  for insert with check (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );
