"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SubmissionStatusBadge } from "@/components/learner/SubmissionStatusBadge";
import type { ExerciseSubmissionRow } from "@/lib/schemas/exerciseSubmission";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { UserRow } from "@/lib/schemas/user";

type Props = {
  submissions: ExerciseSubmissionRow[];
  exercises: ExerciseRow[];
  users: UserRow[];
};

export function SubmissionReviewQueue({ submissions, exercises, users }: Props) {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "all";
  const exerciseFilter = searchParams.get("exercise") ?? "all";

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const userById = new Map(users.map((u) => [u.id, u]));

  const filtered = submissions.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (exerciseFilter !== "all" && s.exercise_id !== exerciseFilter) return false;
    return true;
  });

  function buildUrl(params: Record<string, string>) {
    const current = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v === "all") current.delete(k);
      else current.set(k, v);
    }
    return `/admin/exercises?${current.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="w-40">
          <Select
            value={statusFilter ?? "all"}
            onValueChange={(v) => {
              if (v) window.location.href = buildUrl({ status: v });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-56">
          <Select
            value={exerciseFilter ?? "all"}
            onValueChange={(v) => {
              if (v) window.location.href = buildUrl({ exercise: v });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Exercise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All exercises</SelectItem>
              {exercises.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No submissions match this filter.
        </p>
      ) : (
        <div className="divide-y rounded-lg border text-sm">
          {filtered.map((sub) => {
            const exercise = exerciseById.get(sub.exercise_id);
            const learner = userById.get(sub.user_id);
            return (
              <Link
                key={sub.id}
                href={`/admin/exercises/${sub.id}`}
                className="hover:bg-muted/30 flex items-center justify-between gap-4 px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{exercise?.title ?? sub.exercise_id}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {learner?.name || learner?.email || sub.user_id}
                  </p>
                </div>
                <div className="shrink-0">
                  <SubmissionStatusBadge status={sub.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
