"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import {
  adminCreateMaterial,
  adminUpdateMaterial,
  adminDeleteMaterial,
  adminReorderMaterials,
} from "@/lib/db/materials";
import { CreateMaterialSchema, type CreateMaterialInput } from "@/lib/schemas/material";
import type { UpdateMaterialInput } from "@/lib/schemas/material";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateAll(moduleId: string) {
  revalidatePath(`/admin/modules/${moduleId}/materials`);
  revalidatePath(`/modules/${moduleId}`);
  revalidatePath("/dashboard");
}

export async function createMaterial(input: CreateMaterialInput): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminCreateMaterial(CreateMaterialSchema.parse(input));
    revalidateAll(input.module_id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function updateMaterial(
  id: string,
  moduleId: string,
  input: UpdateMaterialInput
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminUpdateMaterial(id, input);
    revalidateAll(moduleId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function deleteMaterial(id: string, moduleId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const result = await adminDeleteMaterial(id);
    if (!result.ok) {
      return {
        ok: false,
        error:
          "This material has learner click data. Remove all click data from the database before deleting.",
      };
    }
    revalidateAll(moduleId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function reorderMaterials(
  moduleId: string,
  fromOrder: number,
  toOrder: number
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminReorderMaterials(moduleId, fromOrder, toOrder);
    revalidateAll(moduleId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
