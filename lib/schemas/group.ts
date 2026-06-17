import { z } from "zod";

export const GroupRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  project_idea: z.string(),
  created_at: z.string(),
});

export const CreateGroupSchema = z.object({
  name: z.string().min(1),
  project_idea: z.string().default(""),
});

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  project_idea: z.string().optional(),
});

// Form schemas used by client components
export const CreateGroupFormSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  project_idea: z.string().max(1000),
  invited_user_ids: z.array(z.string().uuid()).max(4),
});

export const EditGroupFormSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  project_idea: z.string().max(1000),
  pic_user_id: z.string().uuid(),
});

export type GroupRow = z.infer<typeof GroupRowSchema>;
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;
export type UpdateGroupInput = z.infer<typeof UpdateGroupSchema>;
export type CreateGroupFormInput = z.infer<typeof CreateGroupFormSchema>;
export type EditGroupFormInput = z.infer<typeof EditGroupFormSchema>;
