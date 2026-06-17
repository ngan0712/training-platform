import type { ClickRow } from "@/lib/schemas/click";
import type { MaterialRow } from "@/lib/schemas/material";
import type { ModuleRow } from "@/lib/schemas/module";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { ExerciseSubmissionRow } from "@/lib/schemas/exerciseSubmission";
import type { QuizRow } from "@/lib/schemas/quiz";

export interface ModuleCompletion {
  total: number;
  clicked: number;
  compulsoryTotal: number;
  compulsoryClicked: number;
  isComplete: boolean;
}

/**
 * Computes click+submission progress for a single module.
 * isComplete is true when all compulsory materials have been clicked AND
 * all compulsory exercises have a submitted/reviewed submission AND
 * the compulsory quiz (if any) has a passing attempt.
 *
 * totals include exercises and quizzes when provided so the progress ring
 * denominator reflects the full compulsory workload.
 */
export function moduleCompletion(
  module: ModuleRow,
  allMaterials: MaterialRow[],
  clicks: ClickRow[],
  exercises?: ExerciseRow[],
  submissions?: ExerciseSubmissionRow[],
  quizzes?: QuizRow[],
  passingQuizIds?: Set<string>
): ModuleCompletion {
  const materials = allMaterials.filter((m) => m.module_id === module.id);
  const compulsoryMaterials = materials.filter((m) => m.is_compulsory);
  const clickedIds = new Set(clicks.map((c) => c.material_id));

  const clicked = materials.filter((m) => clickedIds.has(m.id)).length;
  const compulsoryClicked = compulsoryMaterials.filter((m) => clickedIds.has(m.id)).length;
  const materialsComplete =
    compulsoryMaterials.length > 0 && compulsoryClicked === compulsoryMaterials.length;

  // Exercise accounting
  const moduleExercises = (exercises ?? []).filter((e) => e.module_id === module.id);
  const compulsoryExercises = moduleExercises.filter((e) => e.is_compulsory);

  const doneExerciseIds = new Set(
    (submissions ?? [])
      .filter((s) => s.status === "submitted" || s.status === "reviewed")
      .map((s) => s.exercise_id)
  );

  const compulsoryExercisesDone = compulsoryExercises.filter((e) =>
    doneExerciseIds.has(e.id)
  ).length;

  // Quiz accounting — all quizzes are compulsory
  const moduleQuizzes = (quizzes ?? []).filter((q) => q.module_id === module.id);
  const compulsoryQuizzesDone = moduleQuizzes.filter((q) =>
    (passingQuizIds ?? new Set()).has(q.id)
  ).length;

  const compulsoryTotal =
    compulsoryMaterials.length + compulsoryExercises.length + moduleQuizzes.length;
  const compulsoryDoneTotal = compulsoryClicked + compulsoryExercisesDone + compulsoryQuizzesDone;

  const isComplete = compulsoryTotal > 0 && compulsoryDoneTotal === compulsoryTotal;

  return {
    total: materials.length + moduleExercises.length + moduleQuizzes.length,
    clicked: clicked + compulsoryExercisesDone + compulsoryQuizzesDone,
    compulsoryTotal,
    compulsoryClicked: compulsoryDoneTotal,
    isComplete,
  };
}
