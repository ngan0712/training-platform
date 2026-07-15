"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { adminUpdateAppSettings } from "@/lib/db/appSettings";
import { UpdateAppSettingsSchema, type UpdateAppSettingsInput } from "@/lib/schemas/appSettings";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateAppSettings(input: UpdateAppSettingsInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await adminUpdateAppSettings(UpdateAppSettingsSchema.parse(input), admin.id);
    revalidatePath("/admin/settings");
    revalidatePath("/group");
    revalidatePath("/group/edit");
    revalidatePath("/group/create");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
