import { z } from "zod";

export const AppSettingsRowSchema = z.object({
  group_submission_cutoff: z.string(),
  updated_at: z.string(),
  updated_by: z.string().uuid().nullable(),
});

export const UpdateAppSettingsSchema = z.object({
  group_submission_cutoff: z
    .string()
    .min(1, "Required")
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date" }),
});

export type AppSettingsRow = z.infer<typeof AppSettingsRowSchema>;
export type UpdateAppSettingsInput = z.infer<typeof UpdateAppSettingsSchema>;
