"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import {
  adminCreateModule,
  adminUpdateModule,
  adminDeleteModule,
  adminReorderWeeks,
  adminReorderModules,
} from "@/lib/db/modules";
import { CreateModuleSchema, type CreateModuleInput } from "@/lib/schemas/module";
import type { UpdateModuleInput } from "@/lib/schemas/module";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createModule(input: CreateModuleInput): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminCreateModule(CreateModuleSchema.parse(input));
    revalidatePath("/admin/modules");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function updateModule(id: string, input: UpdateModuleInput): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminUpdateModule(id, input);
    revalidatePath("/admin/modules");
    revalidatePath("/dashboard");
    revalidatePath("/modules", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function deleteModule(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const result = await adminDeleteModule(id);
    if (!result.ok) {
      return {
        ok: false,
        error:
          result.error === "HAS_CLICKS"
            ? "This module has learner click data. Remove all click data from the database before deleting."
            : "Module not found.",
      };
    }
    revalidatePath("/admin/modules");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function reorderWeeks(fromWeek: number, toWeek: number): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminReorderWeeks(fromWeek, toWeek);
    revalidatePath("/admin/modules");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function reorderModules(
  weekNumber: number,
  fromOrder: number,
  toOrder: number
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminReorderModules(weekNumber, fromOrder, toOrder);
    revalidatePath("/admin/modules");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
