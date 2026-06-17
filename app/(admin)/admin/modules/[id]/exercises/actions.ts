"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import {
  adminCreateExercise,
  adminUpdateExercise,
  adminDeleteExercise,
  adminReorderExercises,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminDeleteQuestion,
  adminCreateQuestionOption,
  adminDeleteOptionsByQuestion,
} from "@/lib/db/exercises";
import type { ExerciseFormValues } from "@/components/admin/ExerciseForm";
import type { ExerciseQuestionRow } from "@/lib/schemas/exerciseQuestion";

export type ActionResult = { ok: true } | { ok: false; error: string };

const NEEDS_OPTIONS = new Set(["single_choice", "multi_choice", "dropdown"]);

async function persistQuestions(
  exerciseId: string,
  questions: ExerciseFormValues["questions"]
): Promise<void> {
  // Pass 1: create all questions without conditional references
  const created = await Promise.all(
    questions.map((q, i) =>
      adminCreateQuestion({
        exercise_id: exerciseId,
        question_type: q.question_type,
        prompt: q.prompt,
        ref_answer: q.ref_answer || null,
        is_optional: q.is_optional,
        conditional_on_question_id: null,
        conditional_on_value: null,
        order: i + 1,
      })
    )
  );

  // Pass 2: update conditional references now that all IDs exist
  const conditionalUpdates = questions
    .map((q, i) =>
      q.conditional_on_question_index !== null &&
      q.conditional_on_question_index !== undefined &&
      q.conditional_on_question_index >= 0 &&
      q.conditional_on_question_index < created.length
        ? adminUpdateQuestion(created[i].id, {
            conditional_on_question_id: created[q.conditional_on_question_index].id,
            conditional_on_value: q.conditional_on_value || null,
          })
        : null
    )
    .filter(Boolean);
  await Promise.all(conditionalUpdates);

  // Pass 3: create options for choice-type questions
  const optionInserts = questions.flatMap((q, i) =>
    NEEDS_OPTIONS.has(q.question_type)
      ? q.options.map((opt, oi) =>
          adminCreateQuestionOption({
            question_id: created[i].id,
            label: opt.label,
            value: opt.value,
            order: oi + 1,
          })
        )
      : []
  );
  await Promise.all(optionInserts);
}

export async function createExercise(
  moduleId: string,
  values: ExerciseFormValues
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const exercise = await adminCreateExercise({
      module_id: moduleId,
      title: values.title,
      prompt: values.prompt,
      is_compulsory: values.is_compulsory,
      order: values.order,
    });

    await persistQuestions(exercise.id, values.questions);

    revalidatePath(`/admin/modules/${moduleId}/exercises`);
    revalidatePath(`/modules/${moduleId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function updateExercise(
  exerciseId: string,
  values: ExerciseFormValues,
  existingQuestions: ExerciseQuestionRow[]
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const exercise = await adminUpdateExercise(exerciseId, {
      title: values.title,
      prompt: values.prompt,
      is_compulsory: values.is_compulsory,
      order: values.order,
    });

    // Delete all existing questions (options cascade-delete), then re-create.
    await Promise.all(existingQuestions.map((q) => adminDeleteQuestion(q.id)));
    await persistQuestions(exerciseId, values.questions);

    revalidatePath(`/admin/modules/${exercise.module_id}/exercises`);
    revalidatePath(`/modules/${exercise.module_id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function deleteExercise(exerciseId: string, moduleId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminDeleteExercise(exerciseId);
    revalidatePath(`/admin/modules/${moduleId}/exercises`);
    revalidatePath(`/modules/${moduleId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function reorderExercises(
  moduleId: string,
  fromOrder: number,
  toOrder: number
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminReorderExercises(moduleId, fromOrder, toOrder);
    revalidatePath(`/admin/modules/${moduleId}/exercises`);
    revalidatePath(`/modules/${moduleId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
