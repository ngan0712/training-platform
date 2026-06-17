import { z } from "zod";

// ── Quiz ─────────────────────────────────────────────────────────────────────

export const QuizRowSchema = z.object({
  id: z.string().uuid(),
  module_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  pass_threshold: z.number().int().min(1).max(100),
  order: z.number().int(),
  is_compulsory: z.boolean(),
  created_at: z.string(),
});

export type QuizRow = z.infer<typeof QuizRowSchema>;

// ── Quiz questions ────────────────────────────────────────────────────────────

// Option with is_correct — admin-only, never sent to learners.
export const QuizOptionAdminSchema = z.object({
  id: z.string().uuid(),
  question_id: z.string().uuid(),
  label: z.string(),
  order: z.number().int(),
  is_correct: z.boolean(),
});

// Option without is_correct — learner-safe.
export const QuizOptionPublicSchema = z.object({
  id: z.string().uuid(),
  question_id: z.string().uuid(),
  label: z.string(),
  order: z.number().int(),
});

export const QuizQuestionAdminSchema = z.object({
  id: z.string().uuid(),
  quiz_id: z.string().uuid(),
  prompt: z.string(),
  explanation: z.string().nullable(),
  order: z.number().int(),
  options: z.array(QuizOptionAdminSchema),
});

export const QuizQuestionPublicSchema = z.object({
  id: z.string().uuid(),
  quiz_id: z.string().uuid(),
  prompt: z.string(),
  explanation: z.string().nullable(),
  order: z.number().int(),
  options: z.array(QuizOptionPublicSchema),
});

export type QuizOptionAdmin = z.infer<typeof QuizOptionAdminSchema>;
export type QuizOptionPublic = z.infer<typeof QuizOptionPublicSchema>;
export type QuizQuestionAdmin = z.infer<typeof QuizQuestionAdminSchema>;
export type QuizQuestionPublic = z.infer<typeof QuizQuestionPublicSchema>;

// Full quiz with embedded questions — learner view.
export type QuizWithQuestions = QuizRow & { questions: QuizQuestionPublic[] };
// Full quiz with embedded questions — admin view.
export type QuizWithQuestionsAdmin = QuizRow & { questions: QuizQuestionAdmin[] };

// ── Admin form schema (shared between QuizForm client component and server actions) ───

const QuestionFormSchema = z.object({
  prompt: z.string().min(1, "Required"),
  explanation: z.string(),
  options: z
    .array(z.object({ label: z.string().min(1, "Required") }))
    .min(2, "At least 2 options required"),
  correctOptionIndex: z.number().int().min(0),
});

export const QuizFormSchema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string(),
  pass_threshold: z.number().int().min(1).max(100),
  order: z.number().int().min(1),
  questions: z.array(QuestionFormSchema).min(1, "Add at least one question"),
});

export type QuizFormValues = z.infer<typeof QuizFormSchema>;

// ── Attempts ─────────────────────────────────────────────────────────────────

export const QuizAttemptRowSchema = z.object({
  id: z.string().uuid(),
  quiz_id: z.string().uuid(),
  user_id: z.string().uuid(),
  score_pct: z.number().int().min(0).max(100),
  passed: z.boolean(),
  attempt_number: z.number().int().min(1),
  submitted_at: z.string(),
});

export type QuizAttemptRow = z.infer<typeof QuizAttemptRowSchema>;

// Per-question result included in the attempt result returned to the client
// and reconstructed when loading a previous attempt.
export type QuizQuestionResult = {
  question_id: string;
  prompt: string;
  explanation: string | null;
  is_correct: boolean;
  selected_option_id: string;
  selected_label: string;
  correct_option_id: string;
  correct_label: string;
};

// Full graded result — returned by submitQuizAttempt and by getLatestAttemptResult.
export type QuizAttemptResult = QuizAttemptRow & {
  question_results: QuizQuestionResult[];
};
