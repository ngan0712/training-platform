-- 0014_quizzes.sql
-- Append-only: never edit this file after merging to main.

create table if not exists public.quizzes (
  id             uuid        primary key default gen_random_uuid(),
  module_id      uuid        not null references public.modules(id) on delete cascade,
  title          text        not null,
  description    text,
  pass_threshold integer     not null default 80 check (pass_threshold between 1 and 100),
  "order"        int         not null default 1,
  is_compulsory  boolean     not null default true,
  created_at     timestamptz not null default now()
);

-- One quiz per module
create unique index quizzes_module_id_key on public.quizzes (module_id);

alter table public.quizzes enable row level security;

create policy "quizzes_select_authenticated" on public.quizzes
  for select using (auth.uid() is not null);

create policy "quizzes_admin_insert" on public.quizzes
  for insert with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "quizzes_admin_update" on public.quizzes
  for update using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "quizzes_admin_delete" on public.quizzes
  for delete using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Quiz questions (prompts only; options in a separate table)
create table if not exists public.quiz_questions (
  id          uuid        primary key default gen_random_uuid(),
  quiz_id     uuid        not null references public.quizzes(id) on delete cascade,
  prompt      text        not null,
  explanation text,
  "order"     int         not null default 1,
  created_at  timestamptz not null default now()
);

alter table public.quiz_questions enable row level security;

create policy "quiz_questions_select_authenticated" on public.quiz_questions
  for select using (auth.uid() is not null);

-- Options for each question. is_correct is a server-only field — never returned
-- to learners; the application layer strips it before sending to the client.
create table if not exists public.quiz_question_options (
  id          uuid    primary key default gen_random_uuid(),
  question_id uuid    not null references public.quiz_questions(id) on delete cascade,
  label       text    not null,
  "order"     int     not null default 1,
  is_correct  boolean not null default false
);

alter table public.quiz_question_options enable row level security;

create policy "quiz_question_options_select_authenticated" on public.quiz_question_options
  for select using (auth.uid() is not null);
