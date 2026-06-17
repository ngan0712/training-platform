import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  CreateModuleSchema,
  ModuleRowSchema,
  UpdateModuleSchema,
  type CreateModuleInput,
  type ModuleRow,
  type UpdateModuleInput,
} from "@/lib/schemas/module";

export async function getModules(): Promise<ModuleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("id, week_number, order, title, description, required_for_track, created_at")
    .order("week_number")
    .order("order");

  if (error) throw new Error(`getModules: ${error.message}`);
  return (data ?? []).map((row) => ModuleRowSchema.parse(row));
}

export async function getModuleById(id: string): Promise<ModuleRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("id, week_number, order, title, description, required_for_track, created_at")
    .eq("id", id)
    .single();

  if (error) return null;
  const parsed = ModuleRowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function adminCreateModule(input: CreateModuleInput): Promise<ModuleRow> {
  const validated = CreateModuleSchema.parse(input);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("modules")
    .insert({ ...validated, required_for_track: "both" })
    .select()
    .single();

  if (error) throw new Error(`adminCreateModule: ${error.message}`);
  return ModuleRowSchema.parse(data);
}

export async function adminUpdateModule(id: string, input: UpdateModuleInput): Promise<ModuleRow> {
  const validated = UpdateModuleSchema.parse(input);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("modules")
    .update(validated)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`adminUpdateModule: ${error.message}`);
  return ModuleRowSchema.parse(data);
}

type DeleteResult = { ok: true } | { ok: false; error: "HAS_CLICKS" | "NOT_FOUND" };

export async function adminDeleteModule(id: string): Promise<DeleteResult> {
  const supabase = createServiceClient();

  const { data: materials } = await supabase.from("materials").select("id").eq("module_id", id);

  const materialIds = (materials ?? []).map((m) => m.id);

  if (materialIds.length > 0) {
    const { count } = await supabase
      .from("material_clicks")
      .select("id", { count: "exact", head: true })
      .in("material_id", materialIds);

    if (count && count > 0) return { ok: false, error: "HAS_CLICKS" };
  }

  const { error } = await supabase.from("modules").delete().eq("id", id);
  if (error) throw new Error(`adminDeleteModule: ${error.message}`);
  return { ok: true };
}

export async function adminReorderWeeks(fromWeek: number, toWeek: number): Promise<void> {
  const supabase = createServiceClient();
  // Three-step swap through a sentinel to avoid week_number collisions mid-update.
  const TEMP = 0;

  const { error: e1 } = await supabase
    .from("modules")
    .update({ week_number: TEMP })
    .eq("week_number", fromWeek);
  if (e1) throw new Error(`adminReorderWeeks step1: ${e1.message}`);

  const { error: e2 } = await supabase
    .from("modules")
    .update({ week_number: fromWeek })
    .eq("week_number", toWeek);
  if (e2) throw new Error(`adminReorderWeeks step2: ${e2.message}`);

  const { error: e3 } = await supabase
    .from("modules")
    .update({ week_number: toWeek })
    .eq("week_number", TEMP);
  if (e3) throw new Error(`adminReorderWeeks step3: ${e3.message}`);
}

export async function adminReorderModules(
  weekNumber: number,
  fromOrder: number,
  toOrder: number
): Promise<void> {
  const supabase = createServiceClient();

  const [fromRes, toRes] = await Promise.all([
    supabase
      .from("modules")
      .select("id")
      .eq("week_number", weekNumber)
      .eq("order", fromOrder)
      .single(),
    supabase
      .from("modules")
      .select("id")
      .eq("week_number", weekNumber)
      .eq("order", toOrder)
      .single(),
  ]);

  if (!fromRes.data || !toRes.data) {
    throw new Error("adminReorderModules: module not found");
  }

  await Promise.all([
    supabase.from("modules").update({ order: toOrder }).eq("id", fromRes.data.id),
    supabase.from("modules").update({ order: fromOrder }).eq("id", toRes.data.id),
  ]);
}
