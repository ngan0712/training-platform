import { z } from "zod";

export const UserRoleSchema = z.enum(["learner", "admin"]);
export const UserTrackSchema = z.enum(["tech", "non_tech"]).nullable();

export const ParticipationModeSchema = z.enum(["individual", "group"]).nullable().optional();

export const UserRowSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  track: UserTrackSchema,
  created_at: z.string(),
  participation_mode: ParticipationModeSchema,
});

export const UpsertUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().default(""),
  role: UserRoleSchema,
});

export type UserRow = z.infer<typeof UserRowSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UpsertUserInput = z.infer<typeof UpsertUserSchema>;
export type ParticipationMode = "individual" | "group" | null;
