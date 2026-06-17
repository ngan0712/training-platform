"use server";

import { revalidatePath } from "next/cache";
import { requireLearner } from "@/lib/auth/session";
import { submitQuizAttempt as dbSubmitQuizAttempt } from "@/lib/db/quizzes";
import type { QuizAttemptResult } from "@/lib/schemas/quiz";

type AnswerInput = { questionId: string; optionId: string };

export type QuizActionResult =
  | { ok: true; result: QuizAttemptResult }
  | { ok: false; error: string };

export async function submitQuizAttempt(
  quizId: string,
  answers: AnswerInput[]
): Promise<QuizActionResult> {
  const user = await requireLearner();
  try {
    const result = await dbSubmitQuizAttempt(quizId, user.id, answers);
    revalidatePath(`/quiz/${quizId}`);
    revalidatePath("/modules", "layout");
    revalidatePath("/dashboard");
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
