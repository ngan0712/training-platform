import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  AddGroupMemberSchema,
  GroupMemberRowSchema,
  SetPicSchema,
  type AddGroupMemberInput,
  type GroupMemberRow,
  type SetPicInput,
} from "@/lib/schemas/groupMember";

const MAX_GROUP_SIZE = 5;

export async function getMembersByGroup(groupId: string): Promise<GroupMemberRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id, user_id, is_pic")
    .eq("group_id", groupId);

  if (error) throw new Error(`getMembersByGroup: ${error.message}`);
  return (data ?? []).map((row) => GroupMemberRowSchema.parse(row));
}

export async function getGroupByUser(userId: string): Promise<GroupMemberRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id, user_id, is_pic")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`getGroupByUser: ${error.message}`);
  if (!data) return null;
  const parsed = GroupMemberRowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function addGroupMember(input: AddGroupMemberInput): Promise<GroupMemberRow> {
  const validated = AddGroupMemberSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase.from("group_members").insert(validated).select().single();

  if (error) throw new Error(`addGroupMember: ${error.message}`);
  return GroupMemberRowSchema.parse(data);
}

// Atomic create: inserts the group + all members in sequence.
// Uses service client to bypass RLS for the multi-row insert.
// Cleans up the group on member insert failure.
export async function serviceCreateGroupWithMembers(
  groupData: { name: string; project_idea: string },
  creatorId: string,
  invitedUserIds: string[]
): Promise<string> {
  const supabase = createServiceClient();

  const { data: group, error: groupErr } = await supabase
    .from("groups")
    .insert(groupData)
    .select("id")
    .single();

  if (groupErr || !group)
    throw new Error(`serviceCreateGroupWithMembers: ${groupErr?.message ?? "no data"}`);

  const groupId = group.id as string;

  const memberRows = [
    { group_id: groupId, user_id: creatorId, is_pic: true },
    ...invitedUserIds.map((uid) => ({
      group_id: groupId,
      user_id: uid,
      is_pic: false,
    })),
  ];

  const { error: membersErr } = await supabase.from("group_members").insert(memberRows);

  if (membersErr) {
    await supabase.from("groups").delete().eq("id", groupId);
    throw new Error(`serviceCreateGroupWithMembers members: ${membersErr.message}`);
  }

  return groupId;
}

export async function serviceJoinGroup(userId: string, groupId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) throw new Error("You are already in a group");

  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if ((count ?? 0) >= MAX_GROUP_SIZE) throw new Error("This group is full (max 5 members)");

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId, is_pic: false });

  if (error) throw new Error(`serviceJoinGroup: ${error.message}`);
}

export async function serviceLeaveGroup(userId: string, groupId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: memberRow } = await supabase
    .from("group_members")
    .select("is_pic")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!memberRow) throw new Error("You are not a member of this group");
  if (memberRow.is_pic) throw new Error("Assign a new PIC before leaving the group");

  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  const { error: deleteErr } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (deleteErr) throw new Error(`serviceLeaveGroup: ${deleteErr.message}`);

  if ((count ?? 0) <= 1) {
    await supabase.from("groups").delete().eq("id", groupId);
  }
}

// Set PIC for a group. Caller must be a member. Uses service client.
export async function serviceSetPic(
  groupId: string,
  newPicUserId: string,
  callerUserId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: callerRow } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", callerUserId)
    .maybeSingle();

  if (!callerRow) throw new Error("Only group members can change the PIC");

  // Clear all is_pic flags first (avoids unique index violation)
  const { error: clearErr } = await supabase
    .from("group_members")
    .update({ is_pic: false })
    .eq("group_id", groupId);

  if (clearErr) throw new Error(`serviceSetPic clear: ${clearErr.message}`);

  const { error: setErr } = await supabase
    .from("group_members")
    .update({ is_pic: true })
    .eq("group_id", groupId)
    .eq("user_id", newPicUserId);

  if (setErr) throw new Error(`serviceSetPic set: ${setErr.message}`);
}

export async function adminSetPic(input: SetPicInput): Promise<void> {
  const validated = SetPicSchema.parse(input);
  const supabase = createServiceClient();

  const { error: clearError } = await supabase
    .from("group_members")
    .update({ is_pic: false })
    .eq("group_id", validated.group_id);

  if (clearError) throw new Error(`adminSetPic (clear): ${clearError.message}`);

  const { error: setError } = await supabase
    .from("group_members")
    .update({ is_pic: true })
    .eq("group_id", validated.group_id)
    .eq("user_id", validated.user_id);

  if (setError) throw new Error(`adminSetPic (set): ${setError.message}`);
}

// PIC-only: add a learner who is not yet in any group.
export async function servicePicAddMember(
  groupId: string,
  userId: string,
  callerUserId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: callerRow } = await supabase
    .from("group_members")
    .select("is_pic")
    .eq("group_id", groupId)
    .eq("user_id", callerUserId)
    .maybeSingle();

  if (!callerRow?.is_pic) throw new Error("Only the PIC can add members");

  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if ((count ?? 0) >= MAX_GROUP_SIZE) throw new Error("This group is full (max 5 members)");

  const { data: existingMembership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMembership) throw new Error("This learner is already in a group");

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId, is_pic: false });

  if (error) throw new Error(`servicePicAddMember: ${error.message}`);
}

// PIC-only: remove a member (cannot remove self; target must not be PIC).
export async function servicePicRemoveMember(
  groupId: string,
  userId: string,
  callerUserId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: callerRow } = await supabase
    .from("group_members")
    .select("is_pic")
    .eq("group_id", groupId)
    .eq("user_id", callerUserId)
    .maybeSingle();

  if (!callerRow?.is_pic) throw new Error("Only the PIC can remove members");

  if (userId === callerUserId)
    throw new Error("Transfer PIC to another member before removing yourself");

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw new Error(`servicePicRemoveMember: ${error.message}`);
}

export async function adminGetAllMembers(): Promise<GroupMemberRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("group_members").select("group_id, user_id, is_pic");

  if (error) throw new Error(`adminGetAllMembers: ${error.message}`);
  return (data ?? []).map((row) => GroupMemberRowSchema.parse(row));
}

// Returns learner user IDs that are not yet in any group, excluding the given user.
export async function getLearnersNotInAnyGroup(
  excludeUserId: string
): Promise<{ id: string; name: string; email: string }[]> {
  const supabase = createServiceClient();

  const [learnersResult, membersResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email")
      .eq("role", "learner")
      .neq("id", excludeUserId)
      .order("name"),
    supabase.from("group_members").select("user_id"),
  ]);

  if (learnersResult.error)
    throw new Error(`getLearnersNotInAnyGroup: ${learnersResult.error.message}`);
  if (membersResult.error)
    throw new Error(`getLearnersNotInAnyGroup members: ${membersResult.error.message}`);

  const memberIds = new Set((membersResult.data ?? []).map((m) => m.user_id));
  return (learnersResult.data ?? []).filter((u) => !memberIds.has(u.id));
}
