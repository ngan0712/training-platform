import { z } from "zod";

export const ModuleTrackSchema = z.enum(["both", "non_tech_only"]);

export const ModuleRowSchema = z.object({
  id: z.string().uuid(),
  week_number: z.number().int().min(1),
  order: z.number().int().min(1),
  title: z.string(),
  description: z.string(),
  required_for_track: ModuleTrackSchema,
  created_at: z.string(),
});

export const CreateModuleSchema = z.object({
  week_number: z.number().int().min(1),
  order: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string(),
});

export const UpdateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  week_number: z.number().int().min(1).optional(),
  order: z.number().int().min(1).optional(),
});

export type ModuleRow = z.infer<typeof ModuleRowSchema>;
export type ModuleTrack = z.infer<typeof ModuleTrackSchema>;
export type CreateModuleInput = z.infer<typeof CreateModuleSchema>;
export type UpdateModuleInput = z.infer<typeof UpdateModuleSchema>;
