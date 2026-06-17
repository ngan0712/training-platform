import { createServiceClient } from "@/lib/supabase/server";
import type { ParticipationMode } from "@/lib/schemas/user";

// Reads only the participation_mode column from the users table.
// Does NOT cross-check group_members. Callers that already know whether the
// user is in a group should derive the effective mode themselves:
//   groupWithMembers ? 'group' : participationModeField
export async function getParticipationModeField(userId: string): Promise<ParticipationMode> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("participation_mode")
    .eq("id", userId)
    .maybeSingle();

  const mode = data?.participation_mode;
  if (mode === "individual" || mode === "group") return mode;
  return null;
}

export async function setParticipationMode(userId: string, mode: ParticipationMode): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("users")
    .update({ participation_mode: mode })
    .eq("id", userId);
  if (error) throw new Error(`setParticipationMode: ${error.message}`);
}
