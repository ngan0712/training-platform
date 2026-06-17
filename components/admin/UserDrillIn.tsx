import Link from "next/link";
import { ChevronLeft, CheckCircle2, Circle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRow } from "@/lib/schemas/user";
import type { ModuleRow } from "@/lib/schemas/module";
import type { MaterialRow } from "@/lib/schemas/material";
import type { ClickRow } from "@/lib/schemas/click";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { ExerciseSubmissionRow } from "@/lib/schemas/exerciseSubmission";
import type { QuizRow, QuizAttemptRow } from "@/lib/schemas/quiz";

type Props = {
  user: UserRow;
  modules: ModuleRow[];
  materials: MaterialRow[];
  clicks: ClickRow[];
  exercises: ExerciseRow[];
  submissions: ExerciseSubmissionRow[];
  quizzes: QuizRow[];
  quizAttempts: QuizAttemptRow[];
};

function StatusIcon({ done, pending }: { done: boolean; pending?: boolean }) {
  if (done) return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--state-success)]" />;
  if (pending) return <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />;
  return <Circle className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />;
}

export function UserDrillIn({
  user,
  modules,
  materials,
  clicks,
  exercises,
  submissions,
  quizzes,
  quizAttempts,
}: Props) {
  const clickMap = new Map<string, string>();
  for (const click of clicks) {
    clickMap.set(click.material_id, click.clicked_at);
  }

  const submissionMap = new Map<string, ExerciseSubmissionRow>();
  for (const sub of submissions) {
    submissionMap.set(sub.exercise_id, sub);
  }

  // Best (highest score) attempt per quiz
  const bestAttemptByQuiz = new Map<string, QuizAttemptRow>();
  for (const attempt of quizAttempts) {
    const existing = bestAttemptByQuiz.get(attempt.quiz_id);
    if (!existing || attempt.score_pct > existing.score_pct) {
      bestAttemptByQuiz.set(attempt.quiz_id, attempt);
    }
  }

  // Count attempts per quiz
  const attemptCountByQuiz = new Map<string, number>();
  for (const attempt of quizAttempts) {
    attemptCountByQuiz.set(attempt.quiz_id, (attemptCountByQuiz.get(attempt.quiz_id) ?? 0) + 1);
  }

  const quizByModule = new Map<string, QuizRow>();
  for (const quiz of quizzes) {
    quizByModule.set(quiz.module_id, quiz);
  }

  const sortedModules = [...modules].sort((a, b) =>
    a.week_number !== b.week_number ? a.week_number - b.week_number : a.order - b.order
  );

  const weeks = [...new Set(sortedModules.map((m) => m.week_number))].sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav>
        <Link
          href="/admin"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to cohort
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-semibold">{user.name || user.email}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{user.email}</p>
      </header>

      {weeks.map((week) => {
        const weekModules = sortedModules.filter((m) => m.week_number === week);

        return (
          <section key={week}>
            <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
              Week {week}
            </h2>
            <div className="space-y-4">
              {weekModules.map((mod) => {
                const modMaterials = materials
                  .filter((m) => m.module_id === mod.id)
                  .sort((a, b) => a.order - b.order);

                const modExercises = exercises
                  .filter((e) => e.module_id === mod.id)
                  .sort((a, b) => a.order - b.order);

                const modQuiz = quizByModule.get(mod.id);
                const quizAttempt = modQuiz ? bestAttemptByQuiz.get(modQuiz.id) : undefined;
                const attemptCount = modQuiz ? (attemptCountByQuiz.get(modQuiz.id) ?? 0) : 0;

                return (
                  <div key={mod.id} className="bg-card space-y-4 rounded-lg border p-4">
                    <h3 className="font-medium">{mod.title}</h3>

                    {/* Materials */}
                    {modMaterials.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                          Materials
                        </p>
                        <ul className="divide-y">
                          {modMaterials.map((mat) => {
                            const clickedAt = clickMap.get(mat.id);
                            const clicked = !!clickedAt;
                            return (
                              <li key={mat.id} className="flex items-start gap-3 py-2">
                                <StatusIcon done={clicked} />
                                <div className="min-w-0 flex-1">
                                  <span
                                    className={cn("text-sm", !clicked && "text-muted-foreground")}
                                  >
                                    {mat.title}
                                  </span>
                                  {!mat.is_compulsory && (
                                    <span className="text-muted-foreground ml-2 text-xs">
                                      optional
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted-foreground shrink-0 text-xs">
                                  {clickedAt
                                    ? new Date(clickedAt).toLocaleString("en-SG", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })
                                    : "—"}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Exercises */}
                    {modExercises.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                          Exercises
                        </p>
                        <ul className="divide-y">
                          {modExercises.map((ex) => {
                            const sub = submissionMap.get(ex.id);
                            const done = sub?.status === "submitted" || sub?.status === "reviewed";
                            const pending = sub?.status === "draft";
                            return (
                              <li key={ex.id} className="flex items-start gap-3 py-2">
                                <StatusIcon done={done} pending={pending} />
                                <div className="min-w-0 flex-1">
                                  <span className={cn("text-sm", !sub && "text-muted-foreground")}>
                                    {ex.title}
                                  </span>
                                  {!ex.is_compulsory && (
                                    <span className="text-muted-foreground ml-2 text-xs">
                                      optional
                                    </span>
                                  )}
                                  {sub && (
                                    <span
                                      className={cn(
                                        "ml-2 text-xs",
                                        done ? "text-[var(--state-success)]" : "text-amber-500"
                                      )}
                                    >
                                      {sub.status === "reviewed" && sub.outcome
                                        ? `reviewed · ${sub.outcome}`
                                        : sub.status}
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted-foreground shrink-0 text-xs">
                                  {sub?.submitted_at
                                    ? new Date(sub.submitted_at).toLocaleString("en-SG", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })
                                    : "—"}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Quiz */}
                    {modQuiz && (
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                          Quiz
                        </p>
                        <div className="flex items-start gap-3 py-1">
                          {quizAttempt?.passed ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--state-success)]" />
                          ) : quizAttempt ? (
                            <XCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                          ) : (
                            <Circle className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span
                              className={cn("text-sm", !quizAttempt && "text-muted-foreground")}
                            >
                              {modQuiz.title}
                            </span>
                            {quizAttempt && (
                              <span
                                className={cn(
                                  "ml-2 text-xs",
                                  quizAttempt.passed
                                    ? "text-[var(--state-success)]"
                                    : "text-destructive"
                                )}
                              >
                                {quizAttempt.score_pct}% ·{" "}
                                {quizAttempt.passed ? "passed" : "failed"}
                                {attemptCount > 1 ? ` · ${attemptCount} attempts` : ""}
                              </span>
                            )}
                            {!quizAttempt && (
                              <span className="text-muted-foreground ml-2 text-xs">
                                not attempted
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground shrink-0 text-xs">
                            {quizAttempt?.submitted_at
                              ? new Date(quizAttempt.submitted_at).toLocaleString("en-SG", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </div>
                        </div>
                      </div>
                    )}

                    {modMaterials.length === 0 && modExercises.length === 0 && !modQuiz && (
                      <p className="text-muted-foreground text-sm">No content</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
