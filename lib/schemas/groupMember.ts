import { z } from "zod";

export const GroupMemberRowSchema = z.object({
  group_id: z.string().uuid(),
  user_id: z.string().uuid(),
  is_pic: z.boolean(),
});

export const AddGroupMemberSchema = z.object({
  group_id: z.string().uuid(),
  user_id: z.string().uuid(),
  is_pic: z.boolean().default(false),
});

export const SetPicSchema = z.object({
  group_id: z.string().uuid(),
  user_id: z.string().uuid(),
});

export type GroupMemberRow = z.infer<typeof GroupMemberRowSchema>;
export type AddGroupMemberInput = z.infer<typeof AddGroupMemberSchema>;
export type SetPicInput = z.infer<typeof SetPicSchema>;
