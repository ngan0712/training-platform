import { createServiceClient } from "@/lib/supabase/server";
import {
  UpsertUserSchema,
  UserRowSchema,
  type UpsertUserInput,
  type UserRow,
} from "@/lib/schemas/user";

export type UserWithActivity = UserRow & { last_activity: string | null };

export async function upsertUserOnSignIn(input: UpsertUserInput): Promise<void> {
  const validated = UpsertUserSchema.parse(input);
  const supabase = createServiceClient();

  const { error } = await supabase.from("users").upsert(
    {
      id: validated.id,
      email: validated.email,
      name: validated.name,
      role: validated.role,
    },
    { onConflict: "id", ignoreDuplicates: false }
  );

  if (error) throw new Error(`upsertUserOnSignIn: ${error.message}`);
}

export async function updateUserProfile(id: string, input: { name: string }): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("users").update({ name: input.name }).eq("id", id);
  if (error) throw new Error(`updateUserProfile: ${error.message}`);
}

export async function getAllLearners(): Promise<UserRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, role, track, created_at, participation_mode")
    .eq("role", "learner")
    .order("name");
  if (error) throw new Error(`getAllLearners: ${error.message}`);
  return (data ?? []).map((row) => UserRowSchema.parse(row));
}

export async function getAllUsersWithActivity(): Promise<UserWithActivity[]> {
  const supabase = createServiceClient();
  const [usersResult, clicksResult, submissionsResult, attemptsResult] = await Promise.all([
    supabase.from("users").select("id, email, name, role, track, created_at").order("name"),
    supabase.from("clicks").select("user_id, clicked_at"),
    supabase.from("exercise_submissions").select("user_id, updated_at"),
    supabase.from("quiz_attempts").select("user_id, submitted_at"),
  ]);

  if (usersResult.error) throw new Error(`getAllUsersWithActivity: ${usersResult.error.message}`);

  const activityMap = new Map<string, string>();

  function updateMax(userId: string, ts: string | null | undefined) {
    if (!ts) return;
    const current = activityMap.get(userId);
    if (!current || ts > current) activityMap.set(userId, ts);
  }

  for (const row of clicksResult.data ?? []) updateMax(row.user_id, row.clicked_at);
  for (const row of submissionsResult.data ?? []) updateMax(row.user_id, row.updated_at);
  for (const row of attemptsResult.data ?? []) updateMax(row.user_id, row.submitted_at);

  return (usersResult.data ?? []).map((row) => {
    const parsed = UserRowSchema.parse(row);
    return { ...parsed, last_activity: activityMap.get(parsed.id) ?? null };
  });
}

export async function adminUpdateUserTrack(
  id: string,
  track: "tech" | "non_tech" | null
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("users").update({ track }).eq("id", id);
  if (error) throw new Error(`adminUpdateUserTrack: ${error.message}`);
}

export async function adminPromoteToAdmin(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("users").update({ role: "admin" }).eq("id", id);
  if (error) throw new Error(`adminPromoteToAdmin: ${error.message}`);
}

export async function adminClearUserHistory(id: string): Promise<void> {
  const supabase = createServiceClient();
  // exercise_answers cascade from exercise_submissions; quiz_attempt_answers cascade from quiz_attempts
  const [c, s, a] = await Promise.all([
    supabase.from("clicks").delete().eq("user_id", id),
    supabase.from("exercise_submissions").delete().eq("user_id", id),
    supabase.from("quiz_attempts").delete().eq("user_id", id),
  ]);
  if (c.error) throw new Error(`adminClearUserHistory clicks: ${c.error.message}`);
  if (s.error) throw new Error(`adminClearUserHistory submissions: ${s.error.message}`);
  if (a.error) throw new Error(`adminClearUserHistory attempts: ${a.error.message}`);
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, role, track, created_at")
    .eq("id", id)
    .single();

  if (error) return null;

  const parsed = UserRowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
