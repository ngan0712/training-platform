import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ClickRowSchema, type ClickRow } from "@/lib/schemas/click";

/**
 * Insert a click record for the authenticated user.
 * ON CONFLICT DO NOTHING implements first-click-wins — subsequent calls are no-ops.
 * Must be called from a route handler where the user session is active.
 */
export async function recordClick(userId: string, materialId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("material_clicks")
    .upsert(
      { user_id: userId, material_id: materialId },
      { onConflict: "user_id,material_id", ignoreDuplicates: true }
    );

  if (error) throw new Error(`recordClick: ${error.message}`);
}

export async function getClicksByUser(userId: string): Promise<ClickRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_clicks")
    .select("id, user_id, material_id, clicked_at")
    .eq("user_id", userId)
    .order("clicked_at");

  if (error) throw new Error(`getClicksByUser: ${error.message}`);
  return (data ?? []).map((row) => ClickRowSchema.parse(row));
}

export async function adminGetAllClicks(): Promise<ClickRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("material_clicks")
    .select("id, user_id, material_id, clicked_at")
    .order("clicked_at");

  if (error) throw new Error(`adminGetAllClicks: ${error.message}`);
  return (data ?? []).map((row) => ClickRowSchema.parse(row));
}

export async function adminGetClicksByUser(userId: string): Promise<ClickRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("material_clicks")
    .select("id, user_id, material_id, clicked_at")
    .eq("user_id", userId)
    .order("clicked_at");

  if (error) throw new Error(`adminGetClicksByUser: ${error.message}`);
  return (data ?? []).map((row) => ClickRowSchema.parse(row));
}
