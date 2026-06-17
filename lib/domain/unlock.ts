import type { ClickRow } from "@/lib/schemas/click";
import type { MaterialRow } from "@/lib/schemas/material";
import type { ModuleRow } from "@/lib/schemas/module";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { ExerciseSubmissionRow } from "@/lib/schemas/exerciseSubmission";
import type { QuizRow } from "@/lib/schemas/quiz";

/**
 * Returns true if the given module is accessible to a user.
 *
 * Unlock rule: all compulsory materials, compulsory exercises, AND all quizzes
 * of the preceding module must have been completed. The first module is always
 * unlocked.
 *
 * A compulsory exercise is "done" when its submission has status
 * 'submitted' or 'reviewed' (outcome is irrelevant for unlock).
 * A quiz is "done" when the learner has at least one passing attempt.
 */
export function isModuleUnlocked(
  module: ModuleRow,
  allModules: ModuleRow[],
  allMaterials: MaterialRow[],
  clicks: ClickRow[],
  exercises?: ExerciseRow[],
  submissions?: ExerciseSubmissionRow[],
  quizzes?: QuizRow[],
  passingQuizIds?: Set<string>
): boolean {
  const applicable = applicableModules(allModules);
  const idx = applicable.findIndex((m) => m.id === module.id);

  if (idx <= 0) return true; // first module is always unlocked

  const prev = applicable[idx - 1];

  // The predecessor must itself be unlocked — this ensures the chain is
  // unbroken even when an intermediate module has zero compulsory items
  // (otherwise its trivially-passing checks would make later modules appear
  // unlocked despite earlier modules being incomplete).
  if (
    !isModuleUnlocked(
      prev,
      allModules,
      allMaterials,
      clicks,
      exercises,
      submissions,
      quizzes,
      passingQuizIds
    )
  ) {
    return false;
  }

  // Check compulsory materials
  const prevCompulsoryMaterials = allMaterials.filter(
    (m) => m.module_id === prev.id && m.is_compulsory
  );
  const clickedIds = new Set(clicks.map((c) => c.material_id));
  const materialsUnlocked =
    prevCompulsoryMaterials.length === 0 ||
    prevCompulsoryMaterials.every((m) => clickedIds.has(m.id));

  if (!materialsUnlocked) return false;

  // Check compulsory exercises (if exercise data is provided)
  if (exercises && submissions) {
    const prevCompulsoryExercises = exercises.filter(
      (e) => e.module_id === prev.id && e.is_compulsory
    );

    if (prevCompulsoryExercises.length > 0) {
      const doneExerciseIds = new Set(
        submissions
          .filter((s) => s.status === "submitted" || s.status === "reviewed")
          .map((s) => s.exercise_id)
      );
      const exercisesUnlocked = prevCompulsoryExercises.every((e) => doneExerciseIds.has(e.id));
      if (!exercisesUnlocked) return false;
    }
  }

  // All quizzes gate unlock — a passing attempt is required for each one
  if (quizzes && passingQuizIds) {
    const prevQuizzes = quizzes.filter((q) => q.module_id === prev.id);
    if (prevQuizzes.length > 0) {
      const quizPassed = prevQuizzes.every((q) => passingQuizIds.has(q.id));
      if (!quizPassed) return false;
    }
  }

  return true;
}

function applicableModules(modules: ModuleRow[]): ModuleRow[] {
  return [...modules].sort((a, b) =>
    a.week_number !== b.week_number ? a.week_number - b.week_number : a.order - b.order
  );
}
