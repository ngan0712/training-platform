import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  CreateMaterialSchema,
  MaterialRowSchema,
  UpdateMaterialSchema,
  type CreateMaterialInput,
  type MaterialRow,
  type UpdateMaterialInput,
} from "@/lib/schemas/material";

export async function getMaterialsByModule(moduleId: string): Promise<MaterialRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("id, module_id, order, title, url, type, is_compulsory, created_at")
    .eq("module_id", moduleId)
    .order("order");

  if (error) throw new Error(`getMaterialsByModule: ${error.message}`);
  return (data ?? []).map((row) => MaterialRowSchema.parse(row));
}

export async function getAllMaterials(): Promise<MaterialRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("id, module_id, order, title, url, type, is_compulsory, created_at")
    .order("module_id")
    .order("order");

  if (error) throw new Error(`getAllMaterials: ${error.message}`);
  return (data ?? []).map((row) => MaterialRowSchema.parse(row));
}

export async function getMaterialById(id: string): Promise<MaterialRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("id, module_id, order, title, url, type, is_compulsory, created_at")
    .eq("id", id)
    .single();

  if (error) return null;
  const parsed = MaterialRowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function adminCreateMaterial(input: CreateMaterialInput): Promise<MaterialRow> {
  const validated = CreateMaterialSchema.parse(input);
  const supabase = createServiceClient();

  const { data, error } = await supabase.from("materials").insert(validated).select().single();

  if (error) throw new Error(`adminCreateMaterial: ${error.message}`);
  return MaterialRowSchema.parse(data);
}

export async function adminUpdateMaterial(
  id: string,
  input: UpdateMaterialInput
): Promise<MaterialRow> {
  const validated = UpdateMaterialSchema.parse(input);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("materials")
    .update(validated)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`adminUpdateMaterial: ${error.message}`);
  return MaterialRowSchema.parse(data);
}

type DeleteResult = { ok: true } | { ok: false; error: "HAS_CLICKS" };

export async function adminDeleteMaterial(id: string): Promise<DeleteResult> {
  const supabase = createServiceClient();

  const { count } = await supabase
    .from("material_clicks")
    .select("id", { count: "exact", head: true })
    .eq("material_id", id);

  if (count && count > 0) return { ok: false, error: "HAS_CLICKS" };

  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) throw new Error(`adminDeleteMaterial: ${error.message}`);
  return { ok: true };
}

export async function adminReorderMaterials(
  moduleId: string,
  fromOrder: number,
  toOrder: number
): Promise<void> {
  const supabase = createServiceClient();

  const [fromRes, toRes] = await Promise.all([
    supabase
      .from("materials")
      .select("id")
      .eq("module_id", moduleId)
      .eq("order", fromOrder)
      .single(),
    supabase.from("materials").select("id").eq("module_id", moduleId).eq("order", toOrder).single(),
  ]);

  if (!fromRes.data || !toRes.data) {
    throw new Error("adminReorderMaterials: material not found");
  }

  await Promise.all([
    supabase.from("materials").update({ order: toOrder }).eq("id", fromRes.data.id),
    supabase.from("materials").update({ order: fromOrder }).eq("id", toRes.data.id),
  ]);
}
