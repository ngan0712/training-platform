import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  CreateGroupSchema,
  GroupRowSchema,
  UpdateGroupSchema,
  type CreateGroupInput,
  type GroupRow,
  type UpdateGroupInput,
} from "@/lib/schemas/group";

export type GroupMemberDetails = {
  userId: string;
  isPic: boolean;
  email: string;
  name: string;
};

export type GroupWithMembers = {
  group: GroupRow;
  members: GroupMemberDetails[];
};

export type AdminGroupSummary = {
  id: string;
  name: string;
  project_idea: string;
  memberCount: number;
  picName: string;
  weeklyClicks: number;
};

// Unified row for the admin groups table (groups + individual/undecided learners).
export type AdminParticipantRow = {
  rowKey: string; // group id for groups, user id for individuals
  groupName: string; // empty string for individual/undecided learners
  memberNames: string[]; // display names of all members; [learner name] for individuals
  size: number; // 1 for individuals
  project_idea: string;
  weeklyClicks: number;
};

// Searchable group card data used on the /group page.
export type GroupSearchItem = {
  id: string;
  name: string;
  memberNames: string[];
  memberCount: number;
  project_idea: string;
};

export async function getGroups(): Promise<GroupRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, project_idea, created_at")
    .order("created_at");

  if (error) throw new Error(`getGroups: ${error.message}`);
  return (data ?? []).map((row) => GroupRowSchema.parse(row));
}

export async function getGroupById(id: string): Promise<GroupRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, project_idea, created_at")
    .eq("id", id)
    .single();

  if (error) return null;
  const parsed = GroupRowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function getGroupForUser(userId: string): Promise<GroupWithMembers | null> {
  const supabase = createServiceClient();

  const { data: memberRow } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!memberRow) return null;

  const [groupResult, membersResult] = await Promise.all([
    supabase
      .from("groups")
      .select("id, name, project_idea, created_at")
      .eq("id", memberRow.group_id)
      .single(),
    supabase.from("group_members").select("user_id, is_pic").eq("group_id", memberRow.group_id),
  ]);

  if (groupResult.error || !groupResult.data) return null;
  if (membersResult.error) throw new Error(`getGroupForUser: ${membersResult.error.message}`);

  const memberUserIds = (membersResult.data ?? []).map((m) => m.user_id);

  const { data: users, error: usersError } =
    memberUserIds.length > 0
      ? await supabase.from("users").select("id, email, name").in("id", memberUserIds)
      : { data: [], error: null };

  if (usersError) throw new Error(`getGroupForUser users: ${usersError.message}`);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  return {
    group: GroupRowSchema.parse(groupResult.data),
    members: (membersResult.data ?? []).map((m) => {
      const user = userMap.get(m.user_id);
      return {
        userId: m.user_id,
        isPic: m.is_pic,
        email: user?.email ?? "",
        name: user?.name ?? "",
      };
    }),
  };
}

// Returns groups with fewer than maxSize members that the user is not already in.
export async function getOpenGroupsForJoin(
  userId: string,
  maxSize = 5
): Promise<Array<GroupRow & { memberCount: number }>> {
  const supabase = createServiceClient();

  const { data: groups, error: groupsErr } = await supabase
    .from("groups")
    .select("id, name, project_idea, created_at")
    .order("created_at");

  if (groupsErr) throw new Error(`getOpenGroupsForJoin: ${groupsErr.message}`);
  if (!groups || groups.length === 0) return [];

  const { data: allMembers, error: membersErr } = await supabase
    .from("group_members")
    .select("group_id, user_id");

  if (membersErr) throw new Error(`getOpenGroupsForJoin members: ${membersErr.message}`);

  const countByGroup = new Map<string, number>();
  const groupsWithUser = new Set<string>();
  for (const m of allMembers ?? []) {
    countByGroup.set(m.group_id, (countByGroup.get(m.group_id) ?? 0) + 1);
    if (m.user_id === userId) groupsWithUser.add(m.group_id);
  }

  return groups
    .filter((g) => !groupsWithUser.has(g.id) && (countByGroup.get(g.id) ?? 0) < maxSize)
    .map((g) => ({
      ...GroupRowSchema.parse(g),
      memberCount: countByGroup.get(g.id) ?? 0,
    }));
}

export async function getAdminGroupsWithEngagement(): Promise<AdminGroupSummary[]> {
  const supabase = createServiceClient();

  const { data: groups, error: groupsErr } = await supabase
    .from("groups")
    .select("id, name, project_idea, created_at")
    .order("created_at");

  if (groupsErr) throw new Error(`getAdminGroupsWithEngagement: ${groupsErr.message}`);
  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map((g) => g.id);

  const { data: members, error: membersErr } = await supabase
    .from("group_members")
    .select("group_id, user_id, is_pic")
    .in("group_id", groupIds);

  if (membersErr) throw new Error(`getAdminGroupsWithEngagement members: ${membersErr.message}`);

  const allUserIds = [...new Set((members ?? []).map((m) => m.user_id))];

  const [usersResult, clicksResult] = await Promise.all([
    allUserIds.length > 0
      ? supabase.from("users").select("id, name").in("id", allUserIds)
      : Promise.resolve({ data: [], error: null }),
    allUserIds.length > 0
      ? supabase
          .from("material_clicks")
          .select("user_id")
          .in("user_id", allUserIds)
          .gte("clicked_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (usersResult.error)
    throw new Error(`getAdminGroupsWithEngagement users: ${usersResult.error.message}`);
  if (clicksResult.error)
    throw new Error(`getAdminGroupsWithEngagement clicks: ${clicksResult.error.message}`);

  const userMap = new Map((usersResult.data ?? []).map((u) => [u.id, u]));

  const clickCountByUser = new Map<string, number>();
  for (const c of clicksResult.data ?? []) {
    clickCountByUser.set(c.user_id, (clickCountByUser.get(c.user_id) ?? 0) + 1);
  }

  const membersByGroup = new Map<string, Array<{ user_id: string; is_pic: boolean }>>(
    groups.map((g) => [g.id, []])
  );
  for (const m of members ?? []) {
    membersByGroup.get(m.group_id)?.push(m);
  }

  return groups.map((g) => {
    const gMembers = membersByGroup.get(g.id) ?? [];
    const pic = gMembers.find((m) => m.is_pic);
    const weeklyClicks = gMembers.reduce(
      (sum, m) => sum + (clickCountByUser.get(m.user_id) ?? 0),
      0
    );
    return {
      id: g.id,
      name: g.name,
      project_idea: g.project_idea,
      memberCount: gMembers.length,
      picName: pic ? (userMap.get(pic.user_id)?.name ?? "Unknown") : "—",
      weeklyClicks,
    };
  });
}

// Returns all open groups (that the user is not in) with their member names,
// used to power client-side group search on the /group page.
export async function getGroupsWithMemberNames(
  userId: string,
  maxSize = 5
): Promise<GroupSearchItem[]> {
  const supabase = createServiceClient();

  const { data: groups, error: groupsErr } = await supabase
    .from("groups")
    .select("id, name, project_idea, created_at")
    .order("created_at");

  if (groupsErr) throw new Error(`getGroupsWithMemberNames: ${groupsErr.message}`);
  if (!groups || groups.length === 0) return [];

  const { data: allMembers, error: membersErr } = await supabase
    .from("group_members")
    .select("group_id, user_id");

  if (membersErr) throw new Error(`getGroupsWithMemberNames members: ${membersErr.message}`);

  const countByGroup = new Map<string, number>();
  const groupsWithUser = new Set<string>();
  const memberIdsByGroup = new Map<string, string[]>();

  for (const m of allMembers ?? []) {
    countByGroup.set(m.group_id, (countByGroup.get(m.group_id) ?? 0) + 1);
    if (m.user_id === userId) groupsWithUser.add(m.group_id);
    const arr = memberIdsByGroup.get(m.group_id) ?? [];
    arr.push(m.user_id);
    memberIdsByGroup.set(m.group_id, arr);
  }

  const allUserIds = [...new Set((allMembers ?? []).map((m) => m.user_id))];

  const { data: users, error: usersErr } =
    allUserIds.length > 0
      ? await supabase.from("users").select("id, name").in("id", allUserIds)
      : { data: [], error: null };

  if (usersErr) throw new Error(`getGroupsWithMemberNames users: ${usersErr.message}`);

  const userMap = new Map((users ?? []).map((u) => [u.id, u.name ?? ""]));

  return groups
    .filter((g) => !groupsWithUser.has(g.id) && (countByGroup.get(g.id) ?? 0) < maxSize)
    .map((g) => ({
      id: g.id,
      name: g.name,
      project_idea: g.project_idea,
      memberCount: countByGroup.get(g.id) ?? 0,
      memberNames: (memberIdsByGroup.get(g.id) ?? []).map((uid) => userMap.get(uid) ?? ""),
    }));
}

// Unified admin view: groups + learners not in any group (individual/undecided).
export async function getAdminAllParticipants(): Promise<AdminParticipantRow[]> {
  const supabase = createServiceClient();

  const [groupsResult, membersResult, learnersResult] = await Promise.all([
    supabase.from("groups").select("id, name, project_idea, created_at").order("created_at"),
    supabase.from("group_members").select("group_id, user_id, is_pic"),
    supabase.from("users").select("id, name").eq("role", "learner").order("name"),
  ]);

  if (groupsResult.error)
    throw new Error(`getAdminAllParticipants groups: ${groupsResult.error.message}`);
  if (membersResult.error)
    throw new Error(`getAdminAllParticipants members: ${membersResult.error.message}`);
  if (learnersResult.error)
    throw new Error(`getAdminAllParticipants learners: ${learnersResult.error.message}`);

  const allUserIds = [...new Set((membersResult.data ?? []).map((m) => m.user_id))];

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [usersResult, clicksResult] = await Promise.all([
    allUserIds.length > 0
      ? supabase.from("users").select("id, name").in("id", allUserIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
    supabase.from("material_clicks").select("user_id").gte("clicked_at", sevenDaysAgo),
  ]);

  if (usersResult.error)
    throw new Error(`getAdminAllParticipants users: ${usersResult.error.message}`);
  if (clicksResult.error)
    throw new Error(`getAdminAllParticipants clicks: ${clicksResult.error.message}`);

  const userMap = new Map((usersResult.data ?? []).map((u) => [u.id, u.name ?? ""]));
  // Merge in all learners (for individuals who won't be in usersResult)
  for (const u of learnersResult.data ?? []) {
    if (!userMap.has(u.id)) userMap.set(u.id, u.name ?? "");
  }

  const clickCountByUser = new Map<string, number>();
  for (const c of clicksResult.data ?? []) {
    clickCountByUser.set(c.user_id, (clickCountByUser.get(c.user_id) ?? 0) + 1);
  }

  const membersByGroup = new Map<string, Array<{ user_id: string; is_pic: boolean }>>(
    (groupsResult.data ?? []).map((g) => [g.id, []])
  );

  const learnersInAnyGroup = new Set<string>();
  for (const m of membersResult.data ?? []) {
    membersByGroup.get(m.group_id)?.push(m);
    learnersInAnyGroup.add(m.user_id);
  }

  const groupRows: AdminParticipantRow[] = (groupsResult.data ?? []).map((g) => {
    const gMembers = membersByGroup.get(g.id) ?? [];
    const weeklyClicks = gMembers.reduce(
      (sum, m) => sum + (clickCountByUser.get(m.user_id) ?? 0),
      0
    );
    return {
      rowKey: g.id,
      groupName: g.name,
      memberNames: gMembers.map((m) => userMap.get(m.user_id) ?? ""),
      size: gMembers.length,
      project_idea: g.project_idea,
      weeklyClicks,
    };
  });

  const individualRows: AdminParticipantRow[] = (learnersResult.data ?? [])
    .filter((u) => !learnersInAnyGroup.has(u.id))
    .map((u) => ({
      rowKey: u.id,
      groupName: "",
      memberNames: [u.name ?? ""],
      size: 1,
      project_idea: "",
      weeklyClicks: clickCountByUser.get(u.id) ?? 0,
    }));

  return [...groupRows, ...individualRows];
}

export async function createGroup(input: CreateGroupInput): Promise<GroupRow> {
  const validated = CreateGroupSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase.from("groups").insert(validated).select().single();

  if (error) throw new Error(`createGroup: ${error.message}`);
  return GroupRowSchema.parse(data);
}

export async function updateGroup(id: string, input: UpdateGroupInput): Promise<GroupRow> {
  const validated = UpdateGroupSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .update(validated)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateGroup: ${error.message}`);
  return GroupRowSchema.parse(data);
}

export async function adminUpdateGroup(id: string, input: UpdateGroupInput): Promise<GroupRow> {
  const validated = UpdateGroupSchema.parse(input);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("groups")
    .update(validated)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`adminUpdateGroup: ${error.message}`);
  return GroupRowSchema.parse(data);
}

export async function serviceDeleteGroup(groupId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw new Error(`serviceDeleteGroup: ${error.message}`);
}
