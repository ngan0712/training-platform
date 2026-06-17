# 13 — Module Quiz

## Goal

Let admins attach a multiple-choice quiz to a module. Learners take the quiz in-platform, receive an instant score, and must pass (score > 80%) to satisfy compulsory completion. Unlimited retakes are allowed.

This is distinct from the exercise system — quizzes are auto-graded and require no admin review.

## Acceptance criteria

- Admins can create one quiz per module:
  - Give it a title, optional description, pass threshold (default 80, integer 1–100), and `is_compulsory`.
  - Add one or more MCQ questions. Each question has:
    - A prompt (text).
    - 2–6 answer options, each with a display label.
    - Exactly one option marked as correct.
    - An optional explanation (shown to the learner after submission, under wrong answers only).
  - Questions can be reordered (up/down arrows, reusing `ReorderButtons`).
  - Admin can edit or delete the quiz at any time; attempts are unaffected by edits (attempt answers reference option IDs which may become stale — acceptable trade-off in V1).
- Learners see a **Quiz** section at the bottom of the module page.
  - Before any attempt: description + "Start Quiz" button.
  - After a failed attempt: score badge (e.g. "65% — Not passed"), "Retake Quiz" button.
  - After a passing attempt: green "Passed" badge with score. Retake is still available but not prompted.
  - Compulsory quiz with no passing attempt contributes to the module lock (same reasoning shown as for compulsory exercises).
- Learner quiz page (`/quiz/[id]`) shows all questions at once:
  - Each question rendered as radio buttons.
  - All questions must be answered before submission is enabled (no draft save — quizzes are completed in one sitting).
  - On submit, the form is replaced by a result screen showing:
    - Overall score and pass/fail status.
    - Per-question correct/wrong indicator.
    - Correct answer and explanation revealed for wrong answers.
    - "Retake Quiz" and "Back to Module" buttons.
- A learner's compulsory quiz counts toward module unlock when at least one passing attempt exists — extends the rule in `lib/domain/unlock.ts`.
- Status is reflected on:
  - The learner dashboard progress ring (compulsory quizzes included in denominator).
  - The admin completion heatmap (quiz column group).
  - The admin per-user drill-in (quiz section: quiz title, attempts, best score, pass/fail).

## In scope

- New tables: `quizzes`, `quiz_questions`, `quiz_question_options`, `quiz_attempts`, `quiz_attempt_answers`.
- Admin CRUD for quizzes and questions (nested under module admin, separate tab from exercises).
- Auto-grading on submission: runs server-side in one transaction; no background jobs.
- Learner quiz page with immediate result display.
- `is_correct` is never returned to the learner — stripped server-side before the client receives options.
- Unlock logic and completion tracking updates.
- Admin per-user drill-in extension (attempts, best score, pass/fail per quiz).

## Out of scope

- Multi-correct-answer questions.
- Timed quizzes.
- Randomised question or option order.
- Analytics dashboard (pass rate charts, score distributions).
- Admin ability to reset a learner's attempts.
- Notifications when a learner passes.

## Data model

### `quizzes`

| Column           | Type              | Notes                                   |
| ---------------- | ----------------- | --------------------------------------- |
| `id`             | uuid PK           |                                         |
| `module_id`      | uuid FK → modules | unique constraint (one quiz per module) |
| `title`          | text              |                                         |
| `description`    | text              | optional                                |
| `pass_threshold` | integer           | default 80, range 1–100                 |
| `order`          | integer           | position in module page                 |
| `is_compulsory`  | boolean           | default true                            |

### `quiz_questions`

| Column        | Type              | Notes                                                |
| ------------- | ----------------- | ---------------------------------------------------- |
| `id`          | uuid PK           |                                                      |
| `quiz_id`     | uuid FK → quizzes | cascade delete                                       |
| `prompt`      | text              |                                                      |
| `explanation` | text              | optional; shown after submission under wrong answers |
| `order`       | integer           |                                                      |

### `quiz_question_options`

| Column        | Type                     | Notes                                                        |
| ------------- | ------------------------ | ------------------------------------------------------------ |
| `id`          | uuid PK                  |                                                              |
| `question_id` | uuid FK → quiz_questions | cascade delete                                               |
| `label`       | text                     | display text                                                 |
| `order`       | integer                  |                                                              |
| `is_correct`  | boolean                  | exactly one true per question; excluded from learner queries |

### `quiz_attempts`

| Column           | Type              | Notes                                              |
| ---------------- | ----------------- | -------------------------------------------------- |
| `id`             | uuid PK           |                                                    |
| `quiz_id`        | uuid FK → quizzes |                                                    |
| `user_id`        | uuid FK → users   |                                                    |
| `score_pct`      | integer           | 0–100, standard rounding                           |
| `passed`         | boolean           | `score_pct > pass_threshold` at time of submission |
| `attempt_number` | integer           | 1-indexed per (quiz, user)                         |
| `submitted_at`   | timestamptz       |                                                    |

### `quiz_attempt_answers`

| Column        | Type                            | Notes                                                              |
| ------------- | ------------------------------- | ------------------------------------------------------------------ |
| `id`          | uuid PK                         |                                                                    |
| `attempt_id`  | uuid FK → quiz_attempts         | cascade delete                                                     |
| `question_id` | uuid FK → quiz_questions        |                                                                    |
| `option_id`   | uuid FK → quiz_question_options | the option the learner selected                                    |
| `is_correct`  | boolean                         | denormalised at write time from `quiz_question_options.is_correct` |

## Open questions

| #   | Question                                  | Default assumption                                        |
| --- | ----------------------------------------- | --------------------------------------------------------- |
| 1   | Reveal correct answers after submission?  | Yes — learning context, not a high-stakes exam.           |
| 2   | Show full attempt history to learner?     | Show latest result only; history is a future enhancement. |
| 3   | Score rounding: floor, ceiling, or round? | Standard round (≥ 0.5 rounds up).                         |
