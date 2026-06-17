# 11 — In-Platform Exercises

> **Reverses two earlier V1 cuts** ("MCQ / LLM-graded exercises in-platform" and "File upload"). Treat this as **V1.1, post Cohort 1 launch**. Do not block the June 2026 kickoff on this — Google Forms continue to cover exercises for Cohort 1's first weeks. Aim to land this mid-cohort or for Cohort 2.
>
> **Architecture note (revised 2026-05-21):** The original spec proposed exercise-level `type` (`qa` vs `md_upload`). The implemented design moves type to the **question level** — each question carries its own `question_type`. This is strictly more expressive: a single exercise can mix free-text questions, multiple-choice, a file upload, and a conditional follow-up. See ADR-007.

## Goal

Let admins author practice exercises directly on a module, let learners answer them in-platform (text, choice, or file), persist submissions with explicit status, and surface that status everywhere completion is shown.

## Acceptance criteria

- Admins can create an `Exercise` attached to a module:
  - Give it a title, a prompt/instructions, and `is_compulsory`.
  - Add one or more questions. Each question has its own `question_type`:
    - `free_text` — multi-line textarea
    - `single_choice` — radio-style single selection
    - `multi_choice` — checkbox multi-selection
    - `dropdown` — compact single select
    - `file_upload` — per-question file upload (≤ 5 MB)
  - Each question can be marked optional (`is_optional`).
  - Each question can be conditional: shown only when a prior question's answer matches a specified value.
  - Choice questions (`single_choice`, `multi_choice`, `dropdown`) have an editable options list (label + stored value).
  - Admin can optionally set a `ref_answer` per question (admin-only, never shown to learners).
- Learners see exercises on the module page in an **Exercises** section below Materials, each with a status badge: `Not started` / `Draft` / `Submitted` / `Reviewed`.
- Learner can:
  - Open an exercise, see all questions rendered for their type.
  - Conditional questions appear/disappear in real time based on prior answers.
  - **Save draft** (saves text/choice answers; file uploads happen inline on selection).
  - **Submit** (validates all visible, required questions are answered before transitioning).
  - After submit, the form goes read-only. Learner cannot re-edit unless admin reverts to `Draft`.
- Admin reviews on `/admin/exercises`:
  - Queue of submissions with filters (status, exercise).
  - Open a submission, see each question + learner's answer.
  - Mark `Reviewed` with optional `outcome` (`pass` / `fail`) and a free-text feedback note.
  - Can revert a submission to `Draft` (sends it back to the learner).
- A learner's compulsory exercise counts toward module unlock alongside compulsory materials — extends the rule in `lib/domain/unlock.ts`.
- Status is reflected on:
  - The learner dashboard progress ring (compulsory exercises included in the denominator).
  - The admin completion heatmap (exercise column group).
  - The admin per-user drill-in.
  - The CSV export (columns: `exercise_title`, `submission_status`, `submission_outcome`, `submitted_at`).

## In scope

- New tables: `exercises`, `exercise_questions`, `exercise_question_options`, `exercise_submissions`, `exercise_answers`.
- New Supabase Storage bucket: `exercise-uploads` with RLS — learners read/write only their own folder (`{userId}/{submissionId}/{questionId}`), admins read all via service client.
- Admin CRUD for exercises and questions (nested under module CRUD), including options for choice questions and conditional logic config.
- Admin submission review queue + review form.
- Learner submit flow with draft save, per-question type rendering, conditional visibility.
- Status surfacing on dashboard, heatmap, drill-in, CSV export.
- Unlock logic update to include compulsory exercises.

## Out of scope

- LLM auto-grading. Reviews stay manual.
- Per-question scoring or grading. Outcome is whole-submission only.
- Rich text editor for answers. Plain text.
- Versioning beyond keeping the latest submission row per (exercise, learner).
- Notifications to learners when a review is posted (Slack out-of-band for now).
- Reusable question banks across modules.
- Multi-file uploads per question.

## Data model

Tables (all under `public`, all RLS-enforced):

```
exercises (
  id, module_id FK, title, prompt TEXT, is_compulsory BOOL, "order" INT, created_at
)
-- Note: no `type` column — type lives on each question.

exercise_questions (
  id, exercise_id FK, question_type ENUM('free_text','single_choice','multi_choice','file_upload','dropdown'),
  prompt TEXT, ref_answer TEXT NULL, is_optional BOOL DEFAULT false,
  conditional_on_question_id UUID NULL FK self, conditional_on_value TEXT NULL,
  "order" INT
)

exercise_question_options (
  id, question_id FK, label TEXT, value TEXT, "order" INT
)
-- Only relevant for single_choice, multi_choice, dropdown questions.

exercise_submissions (
  id, exercise_id FK, user_id FK,
  status ENUM('draft','submitted','reviewed'),
  outcome ENUM('pass','fail') NULL,
  file_path TEXT NULL,  -- legacy; per-question files now stored in exercise_answers.answer_text
  feedback TEXT NULL, reviewer_id FK NULL,
  submitted_at TIMESTAMPTZ NULL, reviewed_at TIMESTAMPTZ NULL, updated_at
)
-- UNIQUE (exercise_id, user_id)

exercise_answers (
  id, submission_id FK, question_id FK, answer_text TEXT
)
-- UNIQUE (submission_id, question_id)
-- answer_text encoding by type:
--   free_text       → plain text
--   single_choice / dropdown → option value string
--   multi_choice    → JSON array of selected values, e.g. '["opt1","opt2"]'
--   file_upload     → storage path: "{userId}/{submissionId}/{questionId}{ext}"
```

## Status state machine

Server-enforced; never trust client:

- `(none)` → `draft` (first save or file upload)
- `draft` → `submitted` (learner, after validating all visible required questions answered)
- `submitted` → `reviewed` (admin only)
- `submitted` | `reviewed` → `draft` (admin only — "send back")

## Conditional logic

A question is shown when `conditional_on_question_id IS NULL`, OR when the referenced parent question's current answer matches `conditional_on_value`:

- For `single_choice` / `dropdown` parents: `answer === conditional_on_value`
- For `multi_choice` parents: `JSON.parse(answer).includes(conditional_on_value)`

Conditional questions are excluded from required-field validation when hidden.

## File upload

- Handled inline: on file selection, `uploadQuestionFile` server action creates the submission (if needed), uploads to `exercise-uploads/{userId}/{submissionId}/{questionId}{ext}`, and stores the path in `exercise_answers`.
- Limit: 5 MB per file.
- Any file type accepted; admin controls the question prompt to specify expectations.

## Unlock extension

`isModuleUnlocked()` signature: `(module, allModules, allMaterials, clicks, userTrack, exercises?, submissions?)`.
A compulsory exercise is "done" when `status IN ('submitted','reviewed')`. `outcome` is not required for unlock.

## Migrations

| #    | File                               | Purpose                                                                                             |
| ---- | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| 0007 | `0007_exercises.sql`               | `exercises` table + RLS                                                                             |
| 0008 | `0008_exercise_questions.sql`      | `exercise_questions` table + RLS                                                                    |
| 0009 | `0009_exercise_submissions.sql`    | `exercise_submissions` table + RLS                                                                  |
| 0010 | `0010_exercise_answers.sql`        | `exercise_answers` table + RLS                                                                      |
| 0011 | `0011_exercise_uploads_bucket.sql` | Storage bucket + path RLS                                                                           |
| 0012 | `0012_question_types.sql`          | Drop `exercises.type`; add `question_type`, `is_optional`, conditional cols to `exercise_questions` |
| 0013 | `0013_question_options.sql`        | `exercise_question_options` table + RLS                                                             |

0007–0011 applied to production 2026-05-20. 0012–0013 pending.

## Key files

**Schemas:** `lib/schemas/{exercise,exerciseQuestion,exerciseQuestionOption,exerciseSubmission,exerciseAnswer}.ts`

**DB:** `lib/db/{exercises,exerciseSubmissions}.ts`

**Domain:** `lib/domain/{unlock,completion,dashboardState}.ts` — all extended; tests in `__tests__/unlock.test.ts` (21 passing)

**Admin:**

- `components/admin/{ExerciseForm,QuestionFieldArray,ExerciseListTable,SubmissionReviewQueue,SubmissionReviewForm}.tsx`
- `app/(admin)/admin/modules/[id]/exercises/` — list + CRUD
- `app/(admin)/admin/exercises/` — review queue + single submission view

**Learner:**

- `components/learner/{ExerciseForm,ExerciseList,ExerciseRow,SubmissionStatusBadge}.tsx`
- `app/(learner)/exercises/[id]/page.tsx` + `actions.ts` (saveDraft, submitExercise, uploadQuestionFile)

**Surfaces updated:** admin materials page (exercises section + "Add exercise" shortcut), learner module page (Exercises section, exercise-aware progress bar), admin dashboard (heatmap), CSV export.

## Open questions

- **Compulsory exercises gate progression?** Yes — `status IN ('submitted','reviewed')`. `fail` outcome does NOT lock. Admin can force a redo via "send back to draft".
- **Storage cost.** Supabase free tier is 1 GB. 5 MB × 100 learners × ~10 exercises = up to 5 GB worst case. Budget for Pro ($25/mo) from the month file upload exercises are used.
- **Resubmission after `reviewed`?** No via learner UI. Admin "send back to draft" if needed.
- **Should we keep `materials.type = 'form'`?** Yes — both coexist. A `form` material is a click-through Google Form link; an exercise is in-platform with submission tracking. Admins choose per module.

## Definition of Done

- An admin can create an exercise with mixed question types (free text, choice, file upload) in under 3 minutes.
- Conditional questions hide/show correctly in the learner form based on prior answers.
- A learner can save draft and submit; status reflects on the module page and dashboard ring.
- Admin can mark a submission reviewed with outcome and feedback; learner sees the new status.
- Compulsory exercise blocks next-module unlock until submitted (regardless of outcome).
- Heatmap shows Exercises column group; CSV contains the four exercise columns.
- `npm run typecheck` + `npm run test` + `npm run build` all green.
