import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  ExerciseRowSchema,
  CreateExerciseSchema,
  UpdateExerciseSchema,
  type ExerciseRow,
  type CreateExerciseInput,
  type UpdateExerciseInput,
} from "@/lib/schemas/exercise";
import {
  ExerciseQuestionRowSchema,
  ExerciseQuestionPublicSchema,
  type ExerciseQuestionRow,
  type ExerciseQuestionPublic,
  type CreateExerciseQuestionInput,
  type UpdateExerciseQuestionInput,
} from "@/lib/schemas/exerciseQuestion";
import {
  CreateExerciseQuestionOptionSchema,
  type CreateExerciseQuestionOptionInput,
} from "@/lib/schemas/exerciseQuestionOption";

const QUESTION_FIELDS =
  "id, exercise_id, question_type, prompt, is_optional, conditional_on_question_id, conditional_on_value, order, options:exercise_question_options(id, question_id, label, value, order)";

const QUESTION_ADMIN_FIELDS =
  "id, exercise_id, question_type, prompt, ref_answer, is_optional, conditional_on_question_id, conditional_on_value, order, options:exercise_question_options(id, question_id, label, value, order)";

// ── Exercise reads (session client — RLS enforced) ──────────────────────────

export async function getExercisesByModule(moduleId: string): Promise<ExerciseRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, module_id, title, prompt, is_compulsory, order, created_at")
    .eq("module_id", moduleId)
    .order("order");

  if (error) throw new Error(`getExercisesByModule: ${error.message}`);
  return (data ?? []).map((r) => ExerciseRowSchema.parse(r));
}

export async function getAllExercises(): Promise<ExerciseRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, module_id, title, prompt, is_compulsory, order, created_at")
    .order("module_id")
    .order("order");

  if (error) throw new Error(`getAllExercises: ${error.message}`);
  return (data ?? []).map((r) => ExerciseRowSchema.parse(r));
}

export async function getExerciseById(id: string): Promise<ExerciseRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, module_id, title, prompt, is_compulsory, order, created_at")
    .eq("id", id)
    .single();

  if (error) return null;
  const parsed = ExerciseRowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

// Returns questions without ref_answer (learner-safe), with options embedded.
export async function getQuestionsForExercise(
  exerciseId: string
): Promise<ExerciseQuestionPublic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_questions")
    .select(QUESTION_FIELDS)
    .eq("exercise_id", exerciseId)
    .order("order");

  if (error) throw new Error(`getQuestionsForExercise: ${error.message}`);
  return (data ?? []).map((r) => {
    const sorted = {
      ...r,
      options: (r.options ?? []).sort(
        (a: { order: number }, b: { order: number }) => a.order - b.order
      ),
    };
    return ExerciseQuestionPublicSchema.parse(sorted);
  });
}

// Returns questions WITH ref_answer and options (admin-only via service client).
export async function adminGetQuestionsForExercise(
  exerciseId: string
): Promise<ExerciseQuestionRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("exercise_questions")
    .select(QUESTION_ADMIN_FIELDS)
    .eq("exercise_id", exerciseId)
    .order("order");

  if (error) throw new Error(`adminGetQuestionsForExercise: ${error.message}`);
  return (data ?? []).map((r) => {
    const sorted = {
      ...r,
      options: (r.options ?? []).sort(
        (a: { order: number }, b: { order: number }) => a.order - b.order
      ),
    };
    return ExerciseQuestionRowSchema.parse(sorted);
  });
}

// ── Exercise writes (service client — admin only) ───────────────────────────

export async function adminCreateExercise(input: CreateExerciseInput): Promise<ExerciseRow> {
  const validated = CreateExerciseSchema.parse(input);
  const supabase = createServiceClient();

  const { data, error } = await supabase.from("exercises").insert(validated).select().single();

  if (error) throw new Error(`adminCreateExercise: ${error.message}`);
  return ExerciseRowSchema.parse(data);
}

export async function adminUpdateExercise(
  id: string,
  input: UpdateExerciseInput
): Promise<ExerciseRow> {
  const validated = UpdateExerciseSchema.parse(input);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("exercises")
    .update(validated)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`adminUpdateExercise: ${error.message}`);
  return ExerciseRowSchema.parse(data);
}

export async function adminDeleteExercise(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw new Error(`adminDeleteExercise: ${error.message}`);
}

export async function adminCreateQuestion(
  input: CreateExerciseQuestionInput
): Promise<ExerciseQuestionRow> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("exercise_questions")
    .insert({
      exercise_id: input.exercise_id,
      question_type: input.question_type,
      prompt: input.prompt,
      ref_answer: input.ref_answer,
      is_optional: input.is_optional,
      conditional_on_question_id: input.conditional_on_question_id,
      conditional_on_value: input.conditional_on_value,
      order: input.order,
    })
    .select(QUESTION_ADMIN_FIELDS)
    .single();

  if (error) throw new Error(`adminCreateQuestion: ${error.message}`);
  const r = data as typeof data & { options: { order: number }[] };
  return ExerciseQuestionRowSchema.parse({
    ...r,
    options: (r.options ?? []).sort((a, b) => a.order - b.order),
  });
}

export async function adminUpdateQuestion(
  id: string,
  input: UpdateExerciseQuestionInput
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("exercise_questions").update(input).eq("id", id);

  if (error) throw new Error(`adminUpdateQuestion: ${error.message}`);
}

export async function adminDeleteQuestion(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("exercise_questions").delete().eq("id", id);
  if (error) throw new Error(`adminDeleteQuestion: ${error.message}`);
}

export async function adminCreateQuestionOption(
  input: CreateExerciseQuestionOptionInput
): Promise<void> {
  const validated = CreateExerciseQuestionOptionSchema.parse(input);
  const supabase = createServiceClient();
  const { error } = await supabase.from("exercise_question_options").insert(validated);
  if (error) throw new Error(`adminCreateQuestionOption: ${error.message}`);
}

export async function adminDeleteOptionsByQuestion(questionId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("exercise_question_options")
    .delete()
    .eq("question_id", questionId);
  if (error) throw new Error(`adminDeleteOptionsByQuestion: ${error.message}`);
}

export async function adminReorderExercises(
  moduleId: string,
  fromOrder: number,
  toOrder: number
): Promise<void> {
  const supabase = createServiceClient();

  const [fromRes, toRes] = await Promise.all([
    supabase
      .from("exercises")
      .select("id")
      .eq("module_id", moduleId)
      .eq("order", fromOrder)
      .single(),
    supabase.from("exercises").select("id").eq("module_id", moduleId).eq("order", toOrder).single(),
  ]);

  if (!fromRes.data || !toRes.data) {
    throw new Error("adminReorderExercises: exercise not found");
  }

  await Promise.all([
    supabase.from("exercises").update({ order: toOrder }).eq("id", fromRes.data.id),
    supabase.from("exercises").update({ order: fromOrder }).eq("id", toRes.data.id),
  ]);
}
