import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireLearner } from "@/lib/auth/session";
import { getModules, getModuleById } from "@/lib/db/modules";
import { getAllMaterials } from "@/lib/db/materials";
import { getClicksByUser } from "@/lib/db/clicks";
import { getAllExercises, getExercisesByModule } from "@/lib/db/exercises";
import { getSubmissionsByUser } from "@/lib/db/exerciseSubmissions";
import {
  getAllQuizzes,
  getQuizByModule,
  getLatestAttemptForUser,
  getPassingQuizIdsByUser,
} from "@/lib/db/quizzes";
import { isModuleUnlocked } from "@/lib/domain/unlock";
import { MaterialList } from "@/components/learner/MaterialList";
import { LockedModuleBanner } from "@/components/learner/LockedModuleBanner";
import { ExerciseList } from "@/components/learner/ExerciseList";
import { QuizCard } from "@/components/learner/QuizCard";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

type Props = { params: Promise<{ id: string }> };

export default async function ModulePage({ params }: Props) {
  const { id } = await params;
  const user = await requireLearner();

  const mod = await getModuleById(id);
  if (!mod) notFound();

  const [allModules, allMaterials, clicks, allExercises, submissions, allQuizzes, passingQuizIds] =
    await Promise.all([
      getModules(),
      getAllMaterials(),
      getClicksByUser(user.id),
      getAllExercises(),
      getSubmissionsByUser(user.id),
      getAllQuizzes(),
      getPassingQuizIdsByUser(user.id),
    ]);

  const isLocked = !isModuleUnlocked(
    mod,
    allModules,
    allMaterials,
    clicks,
    allExercises,
    submissions,
    allQuizzes,
    passingQuizIds
  );
  const materials = allMaterials
    .filter((m) => m.module_id === id)
    .sort((a, b) => a.order - b.order);

  const moduleExercises = allExercises
    .filter((e) => e.module_id === id)
    .sort((a, b) => a.order - b.order);
  const clickedIds = new Set(clicks.map((c) => c.material_id));

  // Find the previous module for locked-state messaging
  const sortedModules = [...allModules].sort((a, b) =>
    a.week_number !== b.week_number ? a.week_number - b.week_number : a.order - b.order
  );
  const idx = sortedModules.findIndex((m) => m.id === id);
  const prevModule = idx > 0 ? sortedModules[idx - 1] : undefined;

  // Per-module compulsory progress (materials + exercises + quiz)
  const doneExerciseIds = new Set(
    submissions
      .filter((s) => s.status === "submitted" || s.status === "reviewed")
      .map((s) => s.exercise_id)
  );
  const moduleQuiz = await getQuizByModule(id);
  const quizLatestAttempt = moduleQuiz
    ? await getLatestAttemptForUser(moduleQuiz.id, user.id)
    : null;

  const compulsoryMaterialsTotal = materials.filter((m) => m.is_compulsory).length;
  const compulsoryExercisesTotal = moduleExercises.filter((e) => e.is_compulsory).length;
  const compulsoryQuizTotal = moduleQuiz ? 1 : 0;
  const compulsoryTotal = compulsoryMaterialsTotal + compulsoryExercisesTotal + compulsoryQuizTotal;

  const compulsoryMaterialsClicked = materials.filter(
    (m) => m.is_compulsory && clickedIds.has(m.id)
  ).length;
  const compulsoryExercisesDone = moduleExercises.filter(
    (e) => e.is_compulsory && doneExerciseIds.has(e.id)
  ).length;
  const quizPassed = quizLatestAttempt?.passed ? 1 : 0;
  const compulsoryClicked = compulsoryMaterialsClicked + compulsoryExercisesDone + quizPassed;

  const progressPct =
    compulsoryTotal > 0 ? Math.round((compulsoryClicked / compulsoryTotal) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav aria-label="breadcrumb">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </nav>

      <header className="space-y-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Week {mod.week_number}
        </p>
        <h1 className="text-2xl font-semibold">{mod.title}</h1>
        {mod.description && <p className="text-muted-foreground text-sm">{mod.description}</p>}
        {compulsoryTotal > 0 && (
          <Progress value={progressPct} className="pt-1">
            <ProgressLabel>Compulsory progress</ProgressLabel>
            <ProgressValue />
          </Progress>
        )}
      </header>

      {isLocked && <LockedModuleBanner prevModuleTitle={prevModule?.title} />}

      <section>
        <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
          Materials
        </h2>
        <MaterialList
          materials={materials}
          clickedIds={clickedIds}
          isLocked={isLocked}
          prevModuleTitle={prevModule?.title}
        />
      </section>

      {moduleExercises.length > 0 && (
        <section>
          <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
            Exercises
          </h2>
          <ExerciseList
            exercises={moduleExercises}
            submissions={submissions.filter((s) =>
              moduleExercises.some((e) => e.id === s.exercise_id)
            )}
            isLocked={isLocked}
            prevModuleTitle={prevModule?.title}
          />
        </section>
      )}

      {moduleQuiz && (
        <section>
          <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
            Quiz
          </h2>
          <QuizCard
            quiz={moduleQuiz}
            latestAttempt={quizLatestAttempt}
            isLocked={isLocked}
            prevModuleTitle={prevModule?.title}
          />
        </section>
      )}
    </div>
  );
}
