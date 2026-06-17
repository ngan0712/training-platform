import Link from "next/link";
import { Lock, CheckCircle2, ChevronRight } from "lucide-react";
import { requireLearner } from "@/lib/auth/session";
import { getModules } from "@/lib/db/modules";
import { getAllMaterials } from "@/lib/db/materials";
import { getClicksByUser } from "@/lib/db/clicks";
import { getAllExercises } from "@/lib/db/exercises";
import { getSubmissionsByUser } from "@/lib/db/exerciseSubmissions";
import { getAllQuizzes, getPassingQuizIdsByUser } from "@/lib/db/quizzes";
import { dashboardState } from "@/lib/domain/dashboardState";
import { cn } from "@/lib/utils";

export default async function ModulesPage() {
  const user = await requireLearner();

  const [allModules, allMaterials, clicks, exercises, submissions, quizzes, passingQuizIds] =
    await Promise.all([
      getModules(),
      getAllMaterials(),
      getClicksByUser(user.id),
      getAllExercises(),
      getSubmissionsByUser(user.id),
      getAllQuizzes(),
      getPassingQuizIdsByUser(user.id),
    ]);

  const state = dashboardState(
    allModules,
    allMaterials,
    clicks,
    exercises,
    submissions,
    quizzes,
    passingQuizIds
  );
  const entries = state.modules;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Modules</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {entries.filter((e) => e.completion.isComplete).length} of {entries.length} complete
        </p>
      </header>

      <ul className="space-y-3">
        {entries.map(({ module, isUnlocked, completion }) => {
          const isComplete = completion.isComplete;
          const pct =
            completion.compulsoryTotal > 0
              ? Math.round((completion.compulsoryClicked / completion.compulsoryTotal) * 100)
              : 0;

          const inner = (
            <div
              className={cn(
                "flex items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-colors",
                isUnlocked &&
                  !isComplete &&
                  "hover:border-[var(--border-strong)] hover:bg-[var(--bg-raised)]",
                isComplete && "bg-[var(--bg-raised)]",
                !isUnlocked && "opacity-60"
              )}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--state-success)]" />
                ) : isUnlocked ? (
                  <div className="border-primary h-5 w-5 rounded-full border-2" />
                ) : (
                  <Lock className="h-5 w-5 text-[var(--state-locked)]" />
                )}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Week {module.week_number}
                  </span>
                </div>
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    !isUnlocked && "text-[var(--state-locked)]"
                  )}
                >
                  {module.title}
                </p>
                {module.description && (
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {module.description}
                  </p>
                )}
                {completion.compulsoryTotal > 0 && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {completion.compulsoryClicked} / {completion.compulsoryTotal} compulsory
                    {isComplete ? "" : ` · ${pct}%`}
                  </p>
                )}
              </div>

              {isUnlocked && <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />}
            </div>
          );

          return (
            <li key={module.id}>
              {isUnlocked ? <Link href={`/modules/${module.id}`}>{inner}</Link> : inner}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
