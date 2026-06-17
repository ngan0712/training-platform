import { z } from "zod";

export const SubmissionStatusSchema = z.enum(["draft", "submitted", "reviewed"]);
export const SubmissionOutcomeSchema = z.enum(["pass", "fail"]);

export const ExerciseSubmissionRowSchema = z.object({
  id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: SubmissionStatusSchema,
  outcome: SubmissionOutcomeSchema.nullable(),
  file_path: z.string().nullable(),
  feedback: z.string().nullable(),
  reviewer_id: z.string().uuid().nullable(),
  submitted_at: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  updated_at: z.string(),
});

export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;
export type SubmissionOutcome = z.infer<typeof SubmissionOutcomeSchema>;
export type ExerciseSubmissionRow = z.infer<typeof ExerciseSubmissionRowSchema>;
