import { z } from "zod";
import { ExerciseQuestionOptionRowSchema } from "./exerciseQuestionOption";

export const QuestionTypeSchema = z.enum([
  "free_text",
  "single_choice",
  "multi_choice",
  "file_upload",
  "dropdown",
]);

const QuestionBaseSchema = z.object({
  id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  question_type: QuestionTypeSchema,
  prompt: z.string(),
  is_optional: z.boolean(),
  conditional_on_question_id: z.string().uuid().nullable(),
  conditional_on_value: z.string().nullable(),
  order: z.number().int().min(1),
});

// Admin-facing: includes ref_answer and options
export const ExerciseQuestionRowSchema = QuestionBaseSchema.extend({
  ref_answer: z.string().nullable(),
  options: z.array(ExerciseQuestionOptionRowSchema),
});

// Learner-facing: no ref_answer, has options
export const ExerciseQuestionPublicSchema = QuestionBaseSchema.extend({
  options: z.array(ExerciseQuestionOptionRowSchema),
});

export const CreateExerciseQuestionSchema = z.object({
  exercise_id: z.string().uuid(),
  question_type: QuestionTypeSchema,
  prompt: z.string().min(1),
  ref_answer: z.string().nullable(),
  is_optional: z.boolean(),
  conditional_on_question_id: z.string().uuid().nullable(),
  conditional_on_value: z.string().nullable(),
  order: z.number().int().min(1),
});

export const UpdateExerciseQuestionSchema = z.object({
  prompt: z.string().min(1).optional(),
  ref_answer: z.string().nullable().optional(),
  is_optional: z.boolean().optional(),
  conditional_on_question_id: z.string().uuid().nullable().optional(),
  conditional_on_value: z.string().nullable().optional(),
  order: z.number().int().min(1).optional(),
});

export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type ExerciseQuestionRow = z.infer<typeof ExerciseQuestionRowSchema>;
export type ExerciseQuestionPublic = z.infer<typeof ExerciseQuestionPublicSchema>;
export type CreateExerciseQuestionInput = z.infer<typeof CreateExerciseQuestionSchema>;
export type UpdateExerciseQuestionInput = z.infer<typeof UpdateExerciseQuestionSchema>;
