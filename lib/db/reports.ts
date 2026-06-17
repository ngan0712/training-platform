import { createServiceClient } from "@/lib/supabase/server";
import { UserRowSchema, type UserRow } from "@/lib/schemas/user";
import { ModuleRowSchema, type ModuleRow } from "@/lib/schemas/module";
import { MaterialRowSchema, type MaterialRow } from "@/lib/schemas/material";
import { ClickRowSchema, type ClickRow } from "@/lib/schemas/click";
import { ExerciseRowSchema, type ExerciseRow } from "@/lib/schemas/exercise";
import {
  ExerciseSubmissionRowSchema,
  type ExerciseSubmissionRow,
} from "@/lib/schemas/exerciseSubmission";
import {
  QuizRowSchema,
  QuizAttemptRowSchema,
  type QuizRow,
  type QuizAttemptRow,
} from "@/lib/schemas/quiz";

export type CohortMatrix = {
  users: UserRow[];
  modules: ModuleRow[];
  materials: MaterialRow[];
  exercises: ExerciseRow[];
  quizzes: QuizRow[];
  /** userId → materialId → clicked_at timestamp */
  clicksByUser: Map<string, Map<string, string>>;
  /** userId → exerciseId → submission row */
  submissionsByUser: Map<string, Map<string, ExerciseSubmissionRow>>;
  /** userId → Set of quiz_ids the user has passed */
  passingAttemptsByUser: Map<string, Set<string>>;
};

export async function getCohortCompletionMatrix(): Promise<CohortMatrix> {
  const supabase = createServiceClient();

  const [
    usersRes,
    modulesRes,
    materialsRes,
    clicksRes,
    exercisesRes,
    submissionsRes,
    quizzesRes,
    attemptsRes,
  ] = await Promise.all([
    supabase.from("users").select("id, email, name, role, track, created_at").order("name"),
    supabase
      .from("modules")
      .select("id, week_number, order, title, description, required_for_track, created_at")
      .order("week_number")
      .order("order"),
    supabase
      .from("materials")
      .select("id, module_id, order, title, url, type, is_compulsory, created_at")
      .order("module_id")
      .order("order"),
    supabase.from("material_clicks").select("id, user_id, material_id, clicked_at"),
    supabase
      .from("exercises")
      .select("id, module_id, title, prompt, is_compulsory, order, created_at")
      .order("module_id")
      .order("order"),
    supabase
      .from("exercise_submissions")
      .select(
        "id, exercise_id, user_id, status, outcome, file_path, feedback, reviewer_id, submitted_at, reviewed_at, updated_at"
      ),
    supabase
      .from("quizzes")
      .select(
        "id, module_id, title, description, pass_threshold, order, is_compulsory, created_at"
      ),
    supabase.from("quiz_attempts").select("quiz_id, user_id").eq("passed", true),
  ]);

  if (usersRes.error)
    throw new Error(`getCohortCompletionMatrix (users): ${usersRes.error.message}`);
  if (modulesRes.error)
    throw new Error(`getCohortCompletionMatrix (modules): ${modulesRes.error.message}`);
  if (materialsRes.error)
    throw new Error(`getCohortCompletionMatrix (materials): ${materialsRes.error.message}`);
  if (clicksRes.error)
    throw new Error(`getCohortCompletionMatrix (clicks): ${clicksRes.error.message}`);
  if (exercisesRes.error)
    throw new Error(`getCohortCompletionMatrix (exercises): ${exercisesRes.error.message}`);
  if (submissionsRes.error)
    throw new Error(`getCohortCompletionMatrix (submissions): ${submissionsRes.error.message}`);
  if (quizzesRes.error)
    throw new Error(`getCohortCompletionMatrix (quizzes): ${quizzesRes.error.message}`);
  if (attemptsRes.error)
    throw new Error(`getCohortCompletionMatrix (quiz_attempts): ${attemptsRes.error.message}`);

  const users = (usersRes.data ?? []).map((r) => UserRowSchema.parse(r));
  const modules = (modulesRes.data ?? []).map((r) => ModuleRowSchema.parse(r));
  const materials = (materialsRes.data ?? []).map((r) => MaterialRowSchema.parse(r));
  const clicks = (clicksRes.data ?? []).map((r) => ClickRowSchema.parse(r));
  const exercises = (exercisesRes.data ?? []).map((r) => ExerciseRowSchema.parse(r));
  const submissions = (submissionsRes.data ?? []).map((r) => ExerciseSubmissionRowSchema.parse(r));
  const quizzes = (quizzesRes.data ?? []).map((r) => QuizRowSchema.parse(r));

  const clicksByUser = new Map<string, Map<string, string>>();
  for (const click of clicks) {
    let inner = clicksByUser.get(click.user_id);
    if (!inner) {
      inner = new Map();
      clicksByUser.set(click.user_id, inner);
    }
    inner.set(click.material_id, click.clicked_at);
  }

  const submissionsByUser = new Map<string, Map<string, ExerciseSubmissionRow>>();
  for (const sub of submissions) {
    let inner = submissionsByUser.get(sub.user_id);
    if (!inner) {
      inner = new Map();
      submissionsByUser.set(sub.user_id, inner);
    }
    inner.set(sub.exercise_id, sub);
  }

  const passingAttemptsByUser = new Map<string, Set<string>>();
  for (const attempt of attemptsRes.data ?? []) {
    const userId = attempt.user_id as string;
    const quizId = attempt.quiz_id as string;
    let inner = passingAttemptsByUser.get(userId);
    if (!inner) {
      inner = new Set();
      passingAttemptsByUser.set(userId, inner);
    }
    inner.add(quizId);
  }

  return {
    users,
    modules,
    materials,
    exercises,
    quizzes,
    clicksByUser,
    submissionsByUser,
    passingAttemptsByUser,
  };
}

export type UserCompletion = {
  user: UserRow;
  modules: ModuleRow[];
  materials: MaterialRow[];
  clicks: ClickRow[];
  exercises: ExerciseRow[];
  submissions: ExerciseSubmissionRow[];
  quizzes: QuizRow[];
  quizAttempts: QuizAttemptRow[];
};

export async function getUserCompletion(userId: string): Promise<UserCompletion | null> {
  const supabase = createServiceClient();

  const [
    userRes,
    modulesRes,
    materialsRes,
    clicksRes,
    exercisesRes,
    submissionsRes,
    quizzesRes,
    attemptsRes,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, name, role, track, created_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("modules")
      .select("id, week_number, order, title, description, required_for_track, created_at")
      .order("week_number")
      .order("order"),
    supabase
      .from("materials")
      .select("id, module_id, order, title, url, type, is_compulsory, created_at")
      .order("module_id")
      .order("order"),
    supabase
      .from("material_clicks")
      .select("id, user_id, material_id, clicked_at")
      .eq("user_id", userId)
      .order("clicked_at"),
    supabase
      .from("exercises")
      .select("id, module_id, title, prompt, is_compulsory, order, created_at")
      .order("module_id")
      .order("order"),
    supabase
      .from("exercise_submissions")
      .select(
        "id, exercise_id, user_id, status, outcome, file_path, feedback, reviewer_id, submitted_at, reviewed_at, updated_at"
      )
      .eq("user_id", userId),
    supabase
      .from("quizzes")
      .select(
        "id, module_id, title, description, pass_threshold, order, is_compulsory, created_at"
      ),
    supabase
      .from("quiz_attempts")
      .select("id, quiz_id, user_id, score_pct, passed, attempt_number, submitted_at")
      .eq("user_id", userId)
      .order("attempt_number", { ascending: false }),
  ]);

  if (userRes.error) return null;
  if (modulesRes.error) throw new Error(`getUserCompletion (modules): ${modulesRes.error.message}`);
  if (materialsRes.error)
    throw new Error(`getUserCompletion (materials): ${materialsRes.error.message}`);
  if (clicksRes.error) throw new Error(`getUserCompletion (clicks): ${clicksRes.error.message}`);
  if (exercisesRes.error)
    throw new Error(`getUserCompletion (exercises): ${exercisesRes.error.message}`);
  if (submissionsRes.error)
    throw new Error(`getUserCompletion (submissions): ${submissionsRes.error.message}`);
  if (quizzesRes.error) throw new Error(`getUserCompletion (quizzes): ${quizzesRes.error.message}`);
  if (attemptsRes.error)
    throw new Error(`getUserCompletion (quiz_attempts): ${attemptsRes.error.message}`);

  const parsed = UserRowSchema.safeParse(userRes.data);
  if (!parsed.success) return null;

  return {
    user: parsed.data,
    modules: (modulesRes.data ?? []).map((r) => ModuleRowSchema.parse(r)),
    materials: (materialsRes.data ?? []).map((r) => MaterialRowSchema.parse(r)),
    clicks: (clicksRes.data ?? []).map((r) => ClickRowSchema.parse(r)),
    exercises: (exercisesRes.data ?? []).map((r) => ExerciseRowSchema.parse(r)),
    submissions: (submissionsRes.data ?? []).map((r) => ExerciseSubmissionRowSchema.parse(r)),
    quizzes: (quizzesRes.data ?? []).map((r) => QuizRowSchema.parse(r)),
    quizAttempts: (attemptsRes.data ?? []).map((r) => QuizAttemptRowSchema.parse(r)),
  };
}
