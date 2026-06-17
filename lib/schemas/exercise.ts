import { z } from "zod";

export const ExerciseRowSchema = z.object({
  id: z.string().uuid(),
  module_id: z.string().uuid(),
  title: z.string(),
  prompt: z.string(),
  is_compulsory: z.boolean(),
  order: z.number().int().min(1),
  created_at: z.string(),
});

export const CreateExerciseSchema = z.object({
  module_id: z.string().uuid(),
  title: z.string().min(1),
  prompt: z.string(),
  is_compulsory: z.boolean(),
  order: z.number().int().min(1),
});

export const UpdateExerciseSchema = z.object({
  title: z.string().min(1).optional(),
  prompt: z.string().optional(),
  is_compulsory: z.boolean().optional(),
  order: z.number().int().min(1).optional(),
});

export type ExerciseRow = z.infer<typeof ExerciseRowSchema>;
export type CreateExerciseInput = z.infer<typeof CreateExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof UpdateExerciseSchema>;
