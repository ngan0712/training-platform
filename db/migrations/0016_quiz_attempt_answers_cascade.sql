-- 0016_quiz_attempt_answers_cascade.sql
-- Append-only: never edit this file after merging to main.

-- quiz_attempt_answers.question_id and .option_id were created without ON DELETE CASCADE.
-- When an admin edits a quiz, adminUpdateQuiz deletes all quiz_questions for that quiz
-- (quiz_question_options cascade from there). Without CASCADE here, that delete fails with
-- a FK violation because quiz_attempt_answers still references the old question/option rows.
-- The unchecked error let the subsequent INSERT run anyway, doubling the questions.

alter table public.quiz_attempt_answers
  drop constraint quiz_attempt_answers_question_id_fkey,
  add constraint quiz_attempt_answers_question_id_fkey
    foreign key (question_id) references public.quiz_questions(id) on delete cascade;

alter table public.quiz_attempt_answers
  drop constraint quiz_attempt_answers_option_id_fkey,
  add constraint quiz_attempt_answers_option_id_fkey
    foreign key (option_id) references public.quiz_question_options(id) on delete cascade;
