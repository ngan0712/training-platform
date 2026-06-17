import type { ClickRow } from "@/lib/schemas/click";
import type { MaterialRow } from "@/lib/schemas/material";
import type { ModuleRow } from "@/lib/schemas/module";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { ExerciseSubmissionRow } from "@/lib/schemas/exerciseSubmission";
import type { QuizRow } from "@/lib/schemas/quiz";
import { moduleCompletion, type ModuleCompletion } from "./completion";
import { isModuleUnlocked } from "./unlock";

export interface ModuleDashboardEntry {
  module: ModuleRow;
  isUnlocked: boolean;
  completion: ModuleCompletion;
}

export interface DashboardState {
  modules: ModuleDashboardEntry[];
  currentModule: ModuleDashboardEntry | undefined;
}

/**
 * Builds the full dashboard state for a learner.
 * Pure — no I/O. All inputs must be fetched by the caller.
 */
export function dashboardState(
  allModules: ModuleRow[],
  allMaterials: MaterialRow[],
  clicks: ClickRow[],
  exercises?: ExerciseRow[],
  submissions?: ExerciseSubmissionRow[],
  quizzes?: QuizRow[],
  passingQuizIds?: Set<string>
): DashboardState {
  const sorted = [...allModules].sort((a, b) =>
    a.week_number !== b.week_number ? a.week_number - b.week_number : a.order - b.order
  );

  const modules: ModuleDashboardEntry[] = sorted.map((module) => {
    const unlocked = isModuleUnlocked(
      module,
      allModules,
      allMaterials,
      clicks,
      exercises,
      submissions,
      quizzes,
      passingQuizIds
    );
    const completion = moduleCompletion(
      module,
      allMaterials,
      clicks,
      exercises,
      submissions,
      quizzes,
      passingQuizIds
    );
    return { module, isUnlocked: unlocked, completion };
  });

  // Current module: the first unlocked, incomplete module.
  const currentModule = modules.find((m) => m.isUnlocked && !m.completion.isComplete);

  return { modules, currentModule };
}
