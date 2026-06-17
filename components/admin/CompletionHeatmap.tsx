"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserRow } from "@/lib/schemas/user";
import type { ModuleRow } from "@/lib/schemas/module";
import type { MaterialRow } from "@/lib/schemas/material";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { QuizRow } from "@/lib/schemas/quiz";

type MissingFilter = "all" | "missing-exercise" | "missing-quiz";

type WeekStat = {
  matDone: number;
  matTotal: number;
  exDone: number;
  exTotal: number;
  quizPassed: boolean;
  hasQuiz: boolean;
};

type Props = {
  users: UserRow[];
  modules: ModuleRow[];
  materials: MaterialRow[];
  exercises: ExerciseRow[];
  quizzes: QuizRow[];
  clicksByUser: Record<string, string[]>;
  submissionStatusByUser: Record<string, Record<string, string>>;
  passingAttemptsByUser: Record<string, string[]>;
};

function getWeekStat(
  weekMods: ModuleRow[],
  matsByMod: Record<string, MaterialRow[]>,
  exsByMod: Record<string, ExerciseRow[]>,
  quizByMod: Record<string, QuizRow | undefined>,
  clickedIds: Set<string>,
  subStatus: Record<string, string>,
  passingQuizIds: Set<string>
): WeekStat {
  let matDone = 0,
    matTotal = 0,
    exDone = 0,
    exTotal = 0;
  let quizPassed = false,
    hasQuiz = false;
  for (const mod of weekMods) {
    const mats = matsByMod[mod.id] ?? [];
    matTotal += mats.length;
    matDone += mats.filter((m) => clickedIds.has(m.id)).length;
    const exs = exsByMod[mod.id] ?? [];
    exTotal += exs.length;
    exDone += exs.filter((e) => {
      const s = subStatus[e.id];
      return s === "submitted" || s === "reviewed";
    }).length;
    const quiz = quizByMod[mod.id];
    if (quiz) {
      hasQuiz = true;
      if (passingQuizIds.has(quiz.id)) quizPassed = true;
    }
  }
  return { matDone, matTotal, exDone, exTotal, quizPassed, hasQuiz };
}

function isWeekComplete(stat: WeekStat): boolean {
  return (
    (stat.matTotal === 0 || stat.matDone === stat.matTotal) &&
    (stat.exTotal === 0 || stat.exDone === stat.exTotal) &&
    (!stat.hasQuiz || stat.quizPassed)
  );
}

function MiniBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = done === total;
  return (
    <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          complete ? "bg-[var(--state-success)]" : "bg-primary"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// Cell used in the All-weeks overview table
function WeekOverviewCell({ stat, isCurrent }: { stat: WeekStat; isCurrent: boolean }) {
  const isEmpty = stat.matTotal === 0 && stat.exTotal === 0 && !stat.hasQuiz;
  if (isEmpty) return <span className="text-muted-foreground text-xs">—</span>;

  const matOk = stat.matTotal === 0 || stat.matDone === stat.matTotal;
  const exOk = stat.exTotal === 0 || stat.exDone === stat.exTotal;

  return (
    <div
      className={cn(
        "space-y-1.5 rounded-md p-2 text-xs",
        isCurrent && "ring-primary/40 bg-primary/5 ring-1"
      )}
    >
      {stat.matTotal > 0 && (
        <div>
          <div className="mb-0.5 flex justify-between">
            <span className="text-muted-foreground">Content</span>
            <span
              className={cn("font-medium tabular-nums", matOk && "text-[var(--state-success)]")}
            >
              {stat.matDone}/{stat.matTotal}
            </span>
          </div>
          <MiniBar done={stat.matDone} total={stat.matTotal} />
        </div>
      )}
      {stat.exTotal > 0 && (
        <div>
          <div className="mb-0.5 flex justify-between">
            <span className="text-muted-foreground">Exercise</span>
            <span className={cn("font-medium tabular-nums", exOk && "text-[var(--state-success)]")}>
              {stat.exDone}/{stat.exTotal}
            </span>
          </div>
          <MiniBar done={stat.exDone} total={stat.exTotal} />
        </div>
      )}
      {stat.hasQuiz && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Quiz</span>
          <span
            className={cn(
              "font-medium",
              stat.quizPassed ? "text-[var(--state-success)]" : "text-destructive"
            )}
          >
            {stat.quizPassed ? "✓" : "✗"}
          </span>
        </div>
      )}
    </div>
  );
}

export function CompletionHeatmap({
  users,
  modules,
  materials,
  exercises,
  quizzes,
  clicksByUser,
  submissionStatusByUser,
  passingAttemptsByUser,
}: Props) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [missingFilter, setMissingFilter] = useState<MissingFilter>("all");

  // Pre-compute stable lookup maps
  const weeks = [...new Set(modules.map((m) => m.week_number))].sort((a, b) => a - b);

  const modulesByWeek: Record<number, ModuleRow[]> = {};
  for (const w of weeks) {
    modulesByWeek[w] = modules.filter((m) => m.week_number === w);
  }

  const matsByMod: Record<string, MaterialRow[]> = {};
  for (const mod of modules) {
    matsByMod[mod.id] = materials.filter((m) => m.module_id === mod.id && m.is_compulsory);
  }

  const exsByMod: Record<string, ExerciseRow[]> = {};
  for (const mod of modules) {
    exsByMod[mod.id] = exercises.filter((e) => e.module_id === mod.id && e.is_compulsory);
  }

  const quizByMod: Record<string, QuizRow | undefined> = {};
  for (const quiz of quizzes) {
    quizByMod[quiz.module_id] = quiz;
  }

  // Per-user current week (first week not fully complete)
  function userCurrentWeek(userId: string): number | null {
    const clickedIds = new Set(clicksByUser[userId] ?? []);
    const subStatus = submissionStatusByUser[userId] ?? {};
    const passingQuizIds = new Set(passingAttemptsByUser[userId] ?? []);
    for (const w of weeks) {
      const stat = getWeekStat(
        modulesByWeek[w] ?? [],
        matsByMod,
        exsByMod,
        quizByMod,
        clickedIds,
        subStatus,
        passingQuizIds
      );
      if (!isWeekComplete(stat)) return w;
    }
    return null;
  }

  // Cohort's most common current week (shown as "current" label in All view)
  const cohortCurrentWeek: number | null = (() => {
    const counts: Record<number, number> = {};
    for (const user of users) {
      const w = userCurrentWeek(user.id);
      if (w !== null) counts[w] = (counts[w] ?? 0) + 1;
    }
    let best: number | null = null,
      bestCount = 0;
    for (const [w, c] of Object.entries(counts)) {
      if (c > bestCount) {
        bestCount = c;
        best = Number(w);
      }
    }
    return best;
  })();

  // Filtered user list (only relevant in week view with a missing filter active)
  const filteredUsers = (() => {
    if (selectedWeek === null || missingFilter === "all") return users;
    const weekMods = modulesByWeek[selectedWeek] ?? [];
    return users.filter((user) => {
      const subStatus = submissionStatusByUser[user.id] ?? {};
      const passingQuizIds = new Set(passingAttemptsByUser[user.id] ?? []);
      return weekMods.some((mod) => {
        if (missingFilter === "missing-exercise") {
          const exs = exsByMod[mod.id] ?? [];
          return (
            exs.length > 0 &&
            exs.some((e) => {
              const s = subStatus[e.id];
              return s !== "submitted" && s !== "reviewed";
            })
          );
        }
        if (missingFilter === "missing-quiz") {
          const quiz = quizByMod[mod.id];
          return !!quiz && !passingQuizIds.has(quiz.id);
        }
        return false;
      });
    });
  })();

  return (
    <div className="space-y-4">
      {/* ── Layer 1: Week tabs ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setSelectedWeek(null);
            setMissingFilter("all");
          }}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            selectedWeek === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          )}
        >
          All
        </button>
        {weeks.map((w) => (
          <button
            key={w}
            onClick={() => {
              setSelectedWeek(w);
              setMissingFilter("all");
            }}
            className={cn(
              "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              selectedWeek === w
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            W{w}
            {cohortCurrentWeek === w && selectedWeek !== w && (
              <span className="ring-background absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2" />
            )}
          </button>
        ))}
        {cohortCurrentWeek !== null && (
          <span className="text-muted-foreground self-center text-xs">
            · Cohort is on W{cohortCurrentWeek}
          </span>
        )}
      </div>

      {/* ── Layer 2: Missing filter (week view only) ─────────────────────── */}
      {selectedWeek !== null && (
        <div className="flex items-center gap-2">
          {(["all", "missing-exercise", "missing-quiz"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setMissingFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                missingFilter === f
                  ? "bg-secondary text-secondary-foreground ring-border ring-1"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {f === "all"
                ? "All learners"
                : f === "missing-exercise"
                  ? "Missing exercise"
                  : "Missing quiz"}
            </button>
          ))}
          {missingFilter !== "all" && (
            <span className="text-muted-foreground text-xs">
              {filteredUsers.length} of {users.length}
            </span>
          )}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border">
        {selectedWeek === null ? (
          // All-weeks overview: one column per week
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="bg-muted/40 sticky left-0 z-10 min-w-[180px] border-r px-4 py-2.5 text-left font-medium">
                  Learner
                </th>
                {weeks.map((w) => (
                  <th
                    key={w}
                    className={cn(
                      "min-w-[130px] border-r px-3 py-2.5 text-left text-sm font-medium",
                      cohortCurrentWeek === w && "bg-primary/5"
                    )}
                  >
                    W{w}
                    {cohortCurrentWeek === w && (
                      <span className="text-primary ml-1.5 text-[10px] font-normal">current</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={weeks.length + 1}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    No learners yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const clickedIds = new Set(clicksByUser[user.id] ?? []);
                  const subStatus = submissionStatusByUser[user.id] ?? {};
                  const passingQuizIds = new Set(passingAttemptsByUser[user.id] ?? []);
                  const currentWeek = userCurrentWeek(user.id);
                  return (
                    <tr key={user.id} className="hover:bg-muted/20 border-b">
                      <td className="bg-card sticky left-0 z-10 border-r px-4 py-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="font-medium hover:underline"
                        >
                          {user.name || user.email}
                        </Link>
                        {currentWeek !== null && (
                          <div className="text-muted-foreground text-[11px]">
                            W{currentWeek} in progress
                          </div>
                        )}
                        {currentWeek === null && (
                          <div className="text-[11px] text-[var(--state-success)]">
                            All complete
                          </div>
                        )}
                      </td>
                      {weeks.map((w) => {
                        const stat = getWeekStat(
                          modulesByWeek[w] ?? [],
                          matsByMod,
                          exsByMod,
                          quizByMod,
                          clickedIds,
                          subStatus,
                          passingQuizIds
                        );
                        return (
                          <td
                            key={w}
                            className={cn(
                              "border-r px-2 py-2 align-top",
                              cohortCurrentWeek === w && "bg-primary/5"
                            )}
                          >
                            <WeekOverviewCell stat={stat} isCurrent={currentWeek === w} />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          // Single-week detail: Content | Exercises | Quiz columns
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="bg-muted/40 sticky left-0 z-10 min-w-[180px] border-r px-4 py-2.5 text-left font-medium">
                  Learner
                </th>
                <th className="min-w-[140px] border-r px-4 py-2.5 text-left font-medium">
                  Content
                </th>
                <th className="min-w-[140px] border-r px-4 py-2.5 text-left font-medium">
                  Exercises
                </th>
                <th className="min-w-[130px] px-4 py-2.5 text-left font-medium">Quiz</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                    No learners match this filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const clickedIds = new Set(clicksByUser[user.id] ?? []);
                  const subStatus = submissionStatusByUser[user.id] ?? {};
                  const passingQuizIds = new Set(passingAttemptsByUser[user.id] ?? []);
                  const stat = getWeekStat(
                    modulesByWeek[selectedWeek] ?? [],
                    matsByMod,
                    exsByMod,
                    quizByMod,
                    clickedIds,
                    subStatus,
                    passingQuizIds
                  );
                  const matOk = stat.matTotal === 0 || stat.matDone === stat.matTotal;
                  const exOk = stat.exTotal === 0 || stat.exDone === stat.exTotal;

                  return (
                    <tr key={user.id} className="hover:bg-muted/20 border-b">
                      <td className="bg-card sticky left-0 z-10 border-r px-4 py-3">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="font-medium hover:underline"
                        >
                          {user.name || user.email}
                        </Link>
                      </td>

                      {/* Content */}
                      <td className="border-r px-4 py-3">
                        {stat.matTotal === 0 ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className={cn(
                                  "text-sm font-semibold tabular-nums",
                                  matOk && "text-[var(--state-success)]"
                                )}
                              >
                                {stat.matDone}/{stat.matTotal}
                              </span>
                              <span className="text-muted-foreground text-xs">materials</span>
                            </div>
                            <MiniBar done={stat.matDone} total={stat.matTotal} />
                          </div>
                        )}
                      </td>

                      {/* Exercises */}
                      <td className="border-r px-4 py-3">
                        {stat.exTotal === 0 ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className={cn(
                                  "text-sm font-semibold tabular-nums",
                                  exOk && "text-[var(--state-success)]"
                                )}
                              >
                                {stat.exDone}/{stat.exTotal}
                              </span>
                              <span className="text-muted-foreground text-xs">submitted</span>
                            </div>
                            <MiniBar done={stat.exDone} total={stat.exTotal} />
                          </div>
                        )}
                      </td>

                      {/* Quiz */}
                      <td className="px-4 py-3">
                        {!stat.hasQuiz ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : stat.quizPassed ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--state-success)]">
                            <span>✓</span> Passed
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not passed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
