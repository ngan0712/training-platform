import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  AppSettingsRowSchema,
  UpdateAppSettingsSchema,
  type AppSettingsRow,
  type UpdateAppSettingsInput,
} from "@/lib/schemas/appSettings";

export async function getAppSettings(): Promise<AppSettingsRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("group_submission_cutoff, updated_at, updated_by")
    .eq("id", true)
    .single();

  if (error) throw new Error(`getAppSettings: ${error.message}`);
  return AppSettingsRowSchema.parse(data);
}

export async function adminUpdateAppSettings(
  input: UpdateAppSettingsInput,
  adminUserId: string
): Promise<AppSettingsRow> {
  const validated = UpdateAppSettingsSchema.parse(input);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("app_settings")
    .update({
      group_submission_cutoff: new Date(validated.group_submission_cutoff).toISOString(),
      updated_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)
    .select("group_submission_cutoff, updated_at, updated_by")
    .single();

  if (error) throw new Error(`adminUpdateAppSettings: ${error.message}`);
  return AppSettingsRowSchema.parse(data);
}
