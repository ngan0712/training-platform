"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { adminCreateQuiz, adminUpdateQuiz, adminDeleteQuiz } from "@/lib/db/quizzes";
import type { QuizFormValues } from "@/lib/schemas/quiz";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toDbValues(values: QuizFormValues) {
  return {
    title: values.title,
    description: values.description,
    pass_threshold: values.pass_threshold,
    is_compulsory: true,
    order: values.order,
    questions: values.questions.map((q) => ({
      prompt: q.prompt,
      explanation: q.explanation,
      options: q.options.map((opt, oi) => ({
        label: opt.label,
        isCorrect: oi === q.correctOptionIndex,
      })),
    })),
  };
}

export async function createQuiz(moduleId: string, values: QuizFormValues): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminCreateQuiz(moduleId, toDbValues(values));
    revalidatePath(`/admin/modules/${moduleId}/quiz`);
    revalidatePath(`/modules/${moduleId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function updateQuiz(quizId: string, values: QuizFormValues): Promise<ActionResult> {
  await requireAdmin();
  try {
    const quiz = await adminUpdateQuiz(quizId, toDbValues(values));
    revalidatePath(`/admin/modules/${quiz.module_id}/quiz`);
    revalidatePath(`/modules/${quiz.module_id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function deleteQuiz(quizId: string, moduleId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminDeleteQuiz(quizId);
    revalidatePath(`/admin/modules/${moduleId}/quiz`);
    revalidatePath(`/modules/${moduleId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
