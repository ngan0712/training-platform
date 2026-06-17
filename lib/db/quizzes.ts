import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  QuizRowSchema,
  QuizAttemptRowSchema,
  QuizQuestionAdminSchema,
  QuizQuestionPublicSchema,
  type QuizRow,
  type QuizAttemptRow,
  type QuizWithQuestions,
  type QuizWithQuestionsAdmin,
  type QuizQuestionResult,
  type QuizAttemptResult,
} from "@/lib/schemas/quiz";

const OPTION_PUBLIC_FIELDS = "id, question_id, label, order";
const OPTION_ADMIN_FIELDS = "id, question_id, label, order, is_correct";
const QUESTION_PUBLIC_FIELDS = `id, quiz_id, prompt, explanation, order, options:quiz_question_options(${OPTION_PUBLIC_FIELDS})`;
const QUESTION_ADMIN_FIELDS = `id, quiz_id, prompt, explanation, order, options:quiz_question_options(${OPTION_ADMIN_FIELDS})`;

function sortOptions<T extends { order: number }>(options: T[]): T[] {
  return [...options].sort((a, b) => a.order - b.order);
}

// ── Quiz reads (session client — RLS enforced) ────────────────────────────────

export async function getAllQuizzes(): Promise<QuizRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, module_id, title, description, pass_threshold, order, is_compulsory, created_at")
    .order("module_id");

  if (error) throw new Error(`getAllQuizzes: ${error.message}`);
  return (data ?? []).map((r) => QuizRowSchema.parse(r));
}

export async function getQuizByModule(moduleId: string): Promise<QuizWithQuestions | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select(
      `id, module_id, title, description, pass_threshold, order, is_compulsory, created_at, questions:quiz_questions(${QUESTION_PUBLIC_FIELDS})`
    )
    .eq("module_id", moduleId)
    .single();

  if (error) return null;
  const quiz = QuizRowSchema.parse(data);
  const questions = ((data as { questions?: unknown[] }).questions ?? [])
    .map((q) => {
      const raw = q as { options?: { order: number }[] };
      return QuizQuestionPublicSchema.parse({ ...raw, options: sortOptions(raw.options ?? []) });
    })
    .sort((a, b) => a.order - b.order);

  return { ...quiz, questions };
}

export async function getQuizById(quizId: string): Promise<QuizWithQuestions | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select(
      `id, module_id, title, description, pass_threshold, order, is_compulsory, created_at, questions:quiz_questions(${QUESTION_PUBLIC_FIELDS})`
    )
    .eq("id", quizId)
    .single();

  if (error) return null;
  const quiz = QuizRowSchema.parse(data);
  const questions = ((data as { questions?: unknown[] }).questions ?? [])
    .map((q) => {
      const raw = q as { options?: { order: number }[] };
      return QuizQuestionPublicSchema.parse({ ...raw, options: sortOptions(raw.options ?? []) });
    })
    .sort((a, b) => a.order - b.order);

  return { ...quiz, questions };
}

// ── Quiz reads (service client — admin only) ──────────────────────────────────

export function adminGetQuizByModule(moduleId: string): Promise<QuizWithQuestionsAdmin | null> {
  return adminGetQuizByField("module_id", moduleId);
}

export function adminGetQuizById(quizId: string): Promise<QuizWithQuestionsAdmin | null> {
  return adminGetQuizByField("id", quizId);
}

async function adminGetQuizByField(
  field: "id" | "module_id",
  value: string
): Promise<QuizWithQuestionsAdmin | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select(
      `id, module_id, title, description, pass_threshold, order, is_compulsory, created_at, questions:quiz_questions(${QUESTION_ADMIN_FIELDS})`
    )
    .eq(field, value)
    .single();

  if (error) return null;
  const quiz = QuizRowSchema.parse(data);
  const questions = ((data as { questions?: unknown[] }).questions ?? [])
    .map((q) => {
      const raw = q as { options?: { order: number }[] };
      return QuizQuestionAdminSchema.parse({ ...raw, options: sortOptions(raw.options ?? []) });
    })
    .sort((a, b) => a.order - b.order);

  return { ...quiz, questions };
}

// ── Attempt reads ─────────────────────────────────────────────────────────────

// Returns the set of quiz IDs the user has passed (for unlock/completion checks).
export async function getPassingQuizIdsByUser(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("quiz_id")
    .eq("user_id", userId)
    .eq("passed", true);

  if (error) throw new Error(`getPassingQuizIdsByUser: ${error.message}`);
  return new Set((data ?? []).map((r) => r.quiz_id as string));
}

export async function getLatestAttemptForUser(
  quizId: string,
  userId: string
): Promise<QuizAttemptRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, user_id, score_pct, passed, attempt_number, submitted_at")
    .eq("quiz_id", quizId)
    .eq("user_id", userId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  const parsed = QuizAttemptRowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

// Loads a previous attempt's full result, including per-question correctness.
// Uses service client to access is_correct on options.
export async function getLatestAttemptResult(
  quizId: string,
  userId: string
): Promise<QuizAttemptResult | null> {
  const attempt = await getLatestAttemptForUser(quizId, userId);
  if (!attempt) return null;

  const supabase = createServiceClient();

  // Fetch attempt answers with question and option data.
  const { data: answers, error } = await supabase
    .from("quiz_attempt_answers")
    .select(
      `
      question_id,
      option_id,
      is_correct,
      question:quiz_questions(id, prompt, explanation),
      selected_option:quiz_question_options!quiz_attempt_answers_option_id_fkey(id, label)
    `
    )
    .eq("attempt_id", attempt.id);

  if (error) throw new Error(`getLatestAttemptResult: ${error.message}`);

  // For each question we also need the correct option label.
  // Fetch all options for the affected questions.
  const questionIds = (answers ?? []).map((a) => a.question_id as string);
  const { data: allOptions, error: optErr } = await supabase
    .from("quiz_question_options")
    .select("id, question_id, label, is_correct")
    .in("question_id", questionIds)
    .eq("is_correct", true);

  if (optErr) throw new Error(`getLatestAttemptResult options: ${optErr.message}`);

  const correctOptionByQuestion = new Map(
    (allOptions ?? []).map((o) => [o.question_id as string, o as { id: string; label: string }])
  );

  const question_results: QuizQuestionResult[] = (answers ?? []).map((a) => {
    const q = a.question as unknown as {
      id: string;
      prompt: string;
      explanation: string | null;
    } | null;
    const sel = a.selected_option as unknown as { id: string; label: string } | null;
    const correct = correctOptionByQuestion.get(a.question_id as string);

    return {
      question_id: a.question_id as string,
      prompt: q?.prompt ?? "",
      explanation: q?.explanation ?? null,
      is_correct: a.is_correct as boolean,
      selected_option_id: sel?.id ?? "",
      selected_label: sel?.label ?? "",
      correct_option_id: correct?.id ?? "",
      correct_label: correct?.label ?? "",
    };
  });

  return { ...attempt, question_results };
}

// Admin: all attempts for a quiz, across all users.
export async function adminGetAttemptsByQuiz(quizId: string): Promise<QuizAttemptRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, user_id, score_pct, passed, attempt_number, submitted_at")
    .eq("quiz_id", quizId)
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(`adminGetAttemptsByQuiz: ${error.message}`);
  return (data ?? []).map((r) => QuizAttemptRowSchema.parse(r));
}

// Admin: latest attempt per user for all quizzes (for drill-in view).
export async function adminGetLatestAttemptsByUser(
  userId: string
): Promise<(QuizAttemptRow & { quiz_title: string })[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(
      "id, quiz_id, user_id, score_pct, passed, attempt_number, submitted_at, quiz:quizzes(title)"
    )
    .eq("user_id", userId)
    .order("quiz_id")
    .order("attempt_number", { ascending: false });

  if (error) throw new Error(`adminGetLatestAttemptsByUser: ${error.message}`);

  // Keep only the highest attempt_number per quiz (data is ordered so first per quiz is latest).
  const seen = new Set<string>();
  const rows: (QuizAttemptRow & { quiz_title: string })[] = [];
  for (const r of data ?? []) {
    const quizId = r.quiz_id as string;
    if (seen.has(quizId)) continue;
    seen.add(quizId);
    const attempt = QuizAttemptRowSchema.parse(r);
    const quiz = r.quiz as unknown as { title: string } | null;
    rows.push({ ...attempt, quiz_title: quiz?.title ?? "" });
  }
  return rows;
}

// ── Attempt write (learner, via server action) ────────────────────────────────

// Grades and persists a quiz attempt. Uses service client to access is_correct.
// answers: one entry per question — { questionId, optionId }
export async function submitQuizAttempt(
  quizId: string,
  userId: string,
  answers: { questionId: string; optionId: string }[]
): Promise<QuizAttemptResult> {
  const supabase = createServiceClient();

  // 1. Load quiz questions + options (with is_correct) via service client.
  const { data: quizData, error: quizErr } = await supabase
    .from("quizzes")
    .select(
      `pass_threshold, questions:quiz_questions(id, prompt, explanation, options:quiz_question_options(id, label, is_correct))`
    )
    .eq("id", quizId)
    .single();

  if (quizErr || !quizData) throw new Error("Quiz not found");

  type RawOption = { id: string; label: string; is_correct: boolean };
  type RawQuestion = {
    id: string;
    prompt: string;
    explanation: string | null;
    options: RawOption[];
  };
  const questions: RawQuestion[] = (quizData.questions ?? []) as RawQuestion[];
  const passThreshold: number = quizData.pass_threshold as number;

  // Build lookup: questionId → all options
  const optionsByQuestion = new Map<string, RawOption[]>(questions.map((q) => [q.id, q.options]));

  // 2. Validate: every question must have an answer.
  const questionIds = new Set(questions.map((q) => q.id));
  const answeredIds = new Set(answers.map((a) => a.questionId));
  for (const qId of questionIds) {
    if (!answeredIds.has(qId)) {
      throw new Error("All questions must be answered before submitting.");
    }
  }

  // 3. Grade each answer.
  type GradedAnswer = { questionId: string; optionId: string; isCorrect: boolean };
  const graded: GradedAnswer[] = answers.map((a) => {
    const options = optionsByQuestion.get(a.questionId) ?? [];
    const selected = options.find((o) => o.id === a.optionId);
    if (!selected) throw new Error(`Unknown option ${a.optionId} for question ${a.questionId}`);
    return { questionId: a.questionId, optionId: a.optionId, isCorrect: selected.is_correct };
  });

  const correctCount = graded.filter((g) => g.isCorrect).length;
  const totalCount = graded.length;
  const score_pct = Math.round((correctCount / totalCount) * 100);
  const passed = score_pct > passThreshold;

  // 4. Determine attempt number.
  const { data: prevAttempts } = await supabase
    .from("quiz_attempts")
    .select("attempt_number")
    .eq("quiz_id", quizId)
    .eq("user_id", userId)
    .order("attempt_number", { ascending: false })
    .limit(1);

  const prevMax = prevAttempts?.[0]?.attempt_number ?? 0;
  const attempt_number = (prevMax as number) + 1;

  // 5. Insert quiz_attempts using session client so RLS insert policy is satisfied.
  const sessionClient = await createClient();
  const { data: attemptData, error: attemptErr } = await sessionClient
    .from("quiz_attempts")
    .insert({ quiz_id: quizId, user_id: userId, score_pct, passed, attempt_number })
    .select("id, quiz_id, user_id, score_pct, passed, attempt_number, submitted_at")
    .single();

  if (attemptErr || !attemptData) throw new Error(`Failed to save attempt: ${attemptErr?.message}`);
  const attempt = QuizAttemptRowSchema.parse(attemptData);

  // 6. Insert quiz_attempt_answers.
  const answerRows = graded.map((g) => ({
    attempt_id: attempt.id,
    question_id: g.questionId,
    option_id: g.optionId,
    is_correct: g.isCorrect,
  }));

  const { error: answerErr } = await sessionClient.from("quiz_attempt_answers").insert(answerRows);

  if (answerErr) throw new Error(`Failed to save answers: ${answerErr.message}`);

  // 7. Build question_results for the result screen.
  const question_results: QuizQuestionResult[] = graded.map((g) => {
    const q = questions.find((q) => q.id === g.questionId)!;
    const options = optionsByQuestion.get(g.questionId) ?? [];
    const selected = options.find((o) => o.id === g.optionId)!;
    const correct = options.find((o) => o.is_correct)!;
    return {
      question_id: g.questionId,
      prompt: q.prompt,
      explanation: q.explanation,
      is_correct: g.isCorrect,
      selected_option_id: g.optionId,
      selected_label: selected.label,
      correct_option_id: correct.id,
      correct_label: correct.label,
    };
  });

  return { ...attempt, question_results };
}

// ── Quiz writes (service client — admin only) ─────────────────────────────────

export type QuizFormQuestion = {
  prompt: string;
  explanation: string;
  options: { label: string; isCorrect: boolean }[];
};

export type QuizFormValues = {
  title: string;
  description: string;
  pass_threshold: number;
  is_compulsory: boolean;
  order: number;
  questions: QuizFormQuestion[];
};

export async function adminCreateQuiz(moduleId: string, values: QuizFormValues): Promise<QuizRow> {
  const supabase = createServiceClient();

  const { data: quizData, error: quizErr } = await supabase
    .from("quizzes")
    .insert({
      module_id: moduleId,
      title: values.title,
      description: values.description || null,
      pass_threshold: values.pass_threshold,
      is_compulsory: values.is_compulsory,
      order: values.order,
    })
    .select("id, module_id, title, description, pass_threshold, order, is_compulsory, created_at")
    .single();

  if (quizErr || !quizData) throw new Error(`adminCreateQuiz: ${quizErr?.message}`);
  const quiz = QuizRowSchema.parse(quizData);

  await persistQuestionsAndOptions(supabase, quiz.id, values.questions);
  return quiz;
}

export async function adminUpdateQuiz(quizId: string, values: QuizFormValues): Promise<QuizRow> {
  const supabase = createServiceClient();

  const { data: quizData, error: quizErr } = await supabase
    .from("quizzes")
    .update({
      title: values.title,
      description: values.description || null,
      pass_threshold: values.pass_threshold,
      is_compulsory: values.is_compulsory,
      order: values.order,
    })
    .eq("id", quizId)
    .select("id, module_id, title, description, pass_threshold, order, is_compulsory, created_at")
    .single();

  if (quizErr || !quizData) throw new Error(`adminUpdateQuiz: ${quizErr?.message}`);
  const quiz = QuizRowSchema.parse(quizData);

  // Delete all existing questions (options + attempt_answers cascade), then re-create.
  const { error: deleteErr } = await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
  if (deleteErr) throw new Error(`adminUpdateQuiz delete questions: ${deleteErr.message}`);
  await persistQuestionsAndOptions(supabase, quizId, values.questions);

  return quiz;
}

export async function adminDeleteQuiz(quizId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
  if (error) throw new Error(`adminDeleteQuiz: ${error.message}`);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createServiceClient>;

async function persistQuestionsAndOptions(
  supabase: SupabaseClient,
  quizId: string,
  questions: QuizFormQuestion[]
): Promise<void> {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const { data: qRow, error: qErr } = await supabase
      .from("quiz_questions")
      .insert({
        quiz_id: quizId,
        prompt: q.prompt,
        explanation: q.explanation || null,
        order: i + 1,
      })
      .select("id")
      .single();

    if (qErr || !qRow) throw new Error(`persistQuestionsAndOptions: ${qErr?.message}`);

    const optionRows = q.options.map((opt, oi) => ({
      question_id: qRow.id,
      label: opt.label,
      order: oi + 1,
      is_correct: opt.isCorrect,
    }));

    if (optionRows.length > 0) {
      const { error: optErr } = await supabase.from("quiz_question_options").insert(optionRows);
      if (optErr) throw new Error(`persistQuestionsAndOptions options: ${optErr.message}`);
    }
  }
}
