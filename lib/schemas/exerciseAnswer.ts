import { z } from "zod";

export const ExerciseAnswerRowSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  question_id: z.string().uuid(),
  answer_text: z.string().max(5000),
});

export const UpsertAnswerSchema = z.object({
  submission_id: z.string().uuid(),
  question_id: z.string().uuid(),
  answer_text: z.string().max(5000),
});

export type ExerciseAnswerRow = z.infer<typeof ExerciseAnswerRowSchema>;
export type UpsertAnswerInput = z.infer<typeof UpsertAnswerSchema>;
