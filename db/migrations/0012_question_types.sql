-- 0012_question_types.sql
-- Move exercise type to question level. Add question_type, is_optional, and conditional fields.
-- Append-only: never edit this file after merging to main.

-- Exercises no longer have a top-level type; each question carries its own type.
alter table public.exercises drop column if exists type;

-- Add new columns to exercise_questions
alter table public.exercise_questions
  add column if not exists question_type text not null default 'free_text'
    check (question_type in ('free_text', 'single_choice', 'multi_choice', 'file_upload', 'dropdown')),
  add column if not exists is_optional boolean not null default false,
  add column if not exists conditional_on_question_id uuid null
    references public.exercise_questions(id) on delete set null,
  add column if not exists conditional_on_value text null;
