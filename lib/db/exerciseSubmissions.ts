import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  ExerciseSubmissionRowSchema,
  type ExerciseSubmissionRow,
} from "@/lib/schemas/exerciseSubmission";
import {
  ExerciseAnswerRowSchema,
  type ExerciseAnswerRow,
  type UpsertAnswerInput,
} from "@/lib/schemas/exerciseAnswer";

// ── Submission reads ────────────────────────────────────────────────────────

export async function getSubmissionForUser(
  exerciseId: string,
  userId: string
): Promise<ExerciseSubmissionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_submissions")
    .select(
      "id, exercise_id, user_id, status, outcome, file_path, feedback, reviewer_id, submitted_at, reviewed_at, updated_at"
    )
    .eq("exercise_id", exerciseId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  const parsed = ExerciseSubmissionRowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function getSubmissionById(id: string): Promise<ExerciseSubmissionRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("exercise_submissions")
    .select(
      "id, exercise_id, user_id, status, outcome, file_path, feedback, reviewer_id, submitted_at, reviewed_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (error) return null;
  const parsed = ExerciseSubmissionRowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function getSubmissionsByExercise(
  exerciseId: string
): Promise<ExerciseSubmissionRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("exercise_submissions")
    .select(
      "id, exercise_id, user_id, status, outcome, file_path, feedback, reviewer_id, submitted_at, reviewed_at, updated_at"
    )
    .eq("exercise_id", exerciseId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`getSubmissionsByExercise: ${error.message}`);
  return (data ?? []).map((r) => ExerciseSubmissionRowSchema.parse(r));
}

// All submissions for the admin review queue, optionally filtered.
export async function adminGetSubmissions(filters?: {
  status?: string;
  exerciseId?: string;
  userId?: string;
}): Promise<ExerciseSubmissionRow[]> {
  const supabase = createServiceClient();
  let q = supabase
    .from("exercise_submissions")
    .select(
      "id, exercise_id, user_id, status, outcome, file_path, feedback, reviewer_id, submitted_at, reviewed_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.exerciseId) q = q.eq("exercise_id", filters.exerciseId);
  if (filters?.userId) q = q.eq("user_id", filters.userId);

  const { data, error } = await q;
  if (error) throw new Error(`adminGetSubmissions: ${error.message}`);
  return (data ?? []).map((r) => ExerciseSubmissionRowSchema.parse(r));
}

// Submissions for a specific user across all exercises (for unlock/completion checks).
export async function getSubmissionsByUser(userId: string): Promise<ExerciseSubmissionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_submissions")
    .select(
      "id, exercise_id, user_id, status, outcome, file_path, feedback, reviewer_id, submitted_at, reviewed_at, updated_at"
    )
    .eq("user_id", userId);

  if (error) throw new Error(`getSubmissionsByUser: ${error.message}`);
  return (data ?? []).map((r) => ExerciseSubmissionRowSchema.parse(r));
}

// All submissions (service client, for admin reports).
export async function adminGetAllSubmissions(): Promise<ExerciseSubmissionRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("exercise_submissions")
    .select(
      "id, exercise_id, user_id, status, outcome, file_path, feedback, reviewer_id, submitted_at, reviewed_at, updated_at"
    );

  if (error) throw new Error(`adminGetAllSubmissions: ${error.message}`);
  return (data ?? []).map((r) => ExerciseSubmissionRowSchema.parse(r));
}

// ── Answer reads ────────────────────────────────────────────────────────────

export async function getAnswersForSubmission(submissionId: string): Promise<ExerciseAnswerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_answers")
    .select("id, submission_id, question_id, answer_text")
    .eq("submission_id", submissionId);

  if (error) throw new Error(`getAnswersForSubmission: ${error.message}`);
  return (data ?? []).map((r) => ExerciseAnswerRowSchema.parse(r));
}

export async function adminGetAnswersForSubmission(
  submissionId: string
): Promise<ExerciseAnswerRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("exercise_answers")
    .select("id, submission_id, question_id, answer_text")
    .eq("submission_id", submissionId);

  if (error) throw new Error(`adminGetAnswersForSubmission: ${error.message}`);
  return (data ?? []).map((r) => ExerciseAnswerRowSchema.parse(r));
}

// ── Learner writes ──────────────────────────────────────────────────────────

// Creates or updates the submission row (draft save). Status stays 'draft'.
export async function upsertSubmissionDraft(
  exerciseId: string,
  userId: string
): Promise<ExerciseSubmissionRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_submissions")
    .upsert(
      {
        exercise_id: exerciseId,
        user_id: userId,
        status: "draft",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "exercise_id,user_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) throw new Error(`upsertSubmissionDraft: ${error.message}`);
  return ExerciseSubmissionRowSchema.parse(data);
}

// Transitions status draft → submitted. Server enforces this transition.
export async function submitSubmission(
  submissionId: string,
  userId: string
): Promise<ExerciseSubmissionRow> {
  const supabase = await createClient();

  // Fetch current status first to enforce state machine.
  const { data: current } = await supabase
    .from("exercise_submissions")
    .select("status, user_id")
    .eq("id", submissionId)
    .single();

  if (!current || current.user_id !== userId) {
    throw new Error("submitSubmission: not found or forbidden");
  }
  if (current.status !== "draft") {
    throw new Error("submitSubmission: can only submit from draft status");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("exercise_submissions")
    .update({ status: "submitted", submitted_at: now, updated_at: now })
    .eq("id", submissionId)
    .select()
    .single();

  if (error) throw new Error(`submitSubmission: ${error.message}`);
  return ExerciseSubmissionRowSchema.parse(data);
}

// Upserts a single answer (create or update).
export async function upsertAnswer(input: UpsertAnswerInput): Promise<ExerciseAnswerRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_answers")
    .upsert(input, { onConflict: "submission_id,question_id", ignoreDuplicates: false })
    .select()
    .single();

  if (error) throw new Error(`upsertAnswer: ${error.message}`);
  return ExerciseAnswerRowSchema.parse(data);
}

// Updates the file_path on a submission after a successful upload.
export async function setSubmissionFilePath(
  submissionId: string,
  userId: string,
  filePath: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exercise_submissions")
    .update({ file_path: filePath, updated_at: new Date().toISOString() })
    .eq("id", submissionId)
    .eq("user_id", userId);

  if (error) throw new Error(`setSubmissionFilePath: ${error.message}`);
}

// ── Admin writes ────────────────────────────────────────────────────────────

// Marks a submission as reviewed with optional outcome and feedback.
export async function adminReviewSubmission(
  submissionId: string,
  reviewerId: string,
  outcome: "pass" | "fail" | null,
  feedback: string | null
): Promise<ExerciseSubmissionRow> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("exercise_submissions")
    .update({
      status: "reviewed",
      outcome,
      feedback,
      reviewer_id: reviewerId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", submissionId)
    .select()
    .single();

  if (error) throw new Error(`adminReviewSubmission: ${error.message}`);
  return ExerciseSubmissionRowSchema.parse(data);
}

// Reverts a submission back to draft (admin send-back).
export async function adminRevertSubmission(submissionId: string): Promise<ExerciseSubmissionRow> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("exercise_submissions")
    .update({
      status: "draft",
      outcome: null,
      feedback: null,
      reviewer_id: null,
      reviewed_at: null,
      updated_at: now,
    })
    .eq("id", submissionId)
    .select()
    .single();

  if (error) throw new Error(`adminRevertSubmission: ${error.message}`);
  return ExerciseSubmissionRowSchema.parse(data);
}
