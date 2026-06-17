"use server";

import { revalidatePath } from "next/cache";
import { requireLearner } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import {
  upsertSubmissionDraft,
  submitSubmission,
  upsertAnswer,
} from "@/lib/db/exerciseSubmissions";

export type ActionResult = { ok: true; filePath?: string } | { ok: false; error: string };

type AnswerInput = { questionId: string; answerText: string };

export async function saveDraft(exerciseId: string, answers: AnswerInput[]): Promise<ActionResult> {
  const user = await requireLearner();
  try {
    const sub = await upsertSubmissionDraft(exerciseId, user.id);
    await Promise.all(
      answers.map((a) =>
        upsertAnswer({
          submission_id: sub.id,
          question_id: a.questionId,
          answer_text: a.answerText,
        })
      )
    );
    revalidatePath(`/exercises/${exerciseId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function submitExercise(
  exerciseId: string,
  answers: AnswerInput[]
): Promise<ActionResult> {
  const user = await requireLearner();
  try {
    const sub = await upsertSubmissionDraft(exerciseId, user.id);
    await Promise.all(
      answers.map((a) =>
        upsertAnswer({
          submission_id: sub.id,
          question_id: a.questionId,
          answer_text: a.answerText,
        })
      )
    );
    await submitSubmission(sub.id, user.id);
    revalidatePath(`/exercises/${exerciseId}`);
    revalidatePath("/dashboard");
    revalidatePath("/modules");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

const MAX_BYTES = 5 * 1_048_576; // 5 MB

export async function uploadQuestionFile(
  exerciseId: string,
  questionId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireLearner();
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "No file provided" };
    if (file.size > MAX_BYTES) return { ok: false, error: "File must be 5 MB or smaller" };

    // Ensure submission exists
    const sub = await upsertSubmissionDraft(exerciseId, user.id);

    const buffer = await file.arrayBuffer();
    const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";
    const filePath = `${user.id}/${sub.id}/${questionId}${ext}`;

    const supabase = createServiceClient();
    const { error: storageError } = await supabase.storage
      .from("exercise-uploads")
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (storageError) return { ok: false, error: `Upload failed: ${storageError.message}` };

    // Store file path as the answer for this question
    await upsertAnswer({ submission_id: sub.id, question_id: questionId, answer_text: filePath });

    revalidatePath(`/exercises/${exerciseId}`);
    return { ok: true, filePath };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
