import { z } from "zod";

export const MaterialTypeSchema = z.enum(["doc", "slides", "reading", "video", "form"]);

export const MaterialRowSchema = z.object({
  id: z.string().uuid(),
  module_id: z.string().uuid(),
  order: z.number().int().min(1),
  title: z.string(),
  url: z.string().url(),
  type: MaterialTypeSchema,
  is_compulsory: z.boolean(),
  created_at: z.string(),
});

export const CreateMaterialSchema = z.object({
  module_id: z.string().uuid(),
  order: z.number().int().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  type: MaterialTypeSchema,
  is_compulsory: z.boolean(),
});

export const UpdateMaterialSchema = z.object({
  order: z.number().int().min(1).optional(),
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  type: MaterialTypeSchema.optional(),
  is_compulsory: z.boolean().optional(),
});

export type MaterialRow = z.infer<typeof MaterialRowSchema>;
export type MaterialType = z.infer<typeof MaterialTypeSchema>;
export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>;
