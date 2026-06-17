import { z } from "zod";

export const ExerciseQuestionOptionRowSchema = z.object({
  id: z.string().uuid(),
  question_id: z.string().uuid(),
  label: z.string(),
  value: z.string(),
  order: z.number().int(),
});

export const CreateExerciseQuestionOptionSchema = z.object({
  question_id: z.string().uuid(),
  label: z.string().min(1),
  value: z.string().min(1),
  order: z.number().int().min(1),
});

export type ExerciseQuestionOptionRow = z.infer<typeof ExerciseQuestionOptionRowSchema>;
export type CreateExerciseQuestionOptionInput = z.infer<typeof CreateExerciseQuestionOptionSchema>;
