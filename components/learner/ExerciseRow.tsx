"use client";

import Link from "next/link";
import { Lock, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SubmissionStatusBadge } from "@/components/learner/SubmissionStatusBadge";
import { cn } from "@/lib/utils";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { SubmissionStatus } from "@/lib/schemas/exerciseSubmission";

type Props = {
  exercise: ExerciseRow;
  submissionStatus: SubmissionStatus | null;
  isLocked: boolean;
  prevModuleTitle?: string;
};

export function ExerciseRow({ exercise, submissionStatus, isLocked, prevModuleTitle }: Props) {
  const isDone = submissionStatus === "submitted" || submissionStatus === "reviewed";

  const rowContent = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-colors",
        isDone && "bg-[var(--bg-raised)]",
        !isLocked && !isDone && "hover:border-[var(--border-strong)] hover:bg-[var(--bg-raised)]",
        isLocked && "opacity-60"
      )}
    >
      <span
        className={cn(
          "text-muted-foreground shrink-0",
          isDone && "text-[var(--state-success)]",
          isLocked && "text-[var(--state-locked)]"
        )}
      >
        <ClipboardList className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-medium",
            isDone && "text-muted-foreground",
            isLocked && "text-[var(--state-locked)]"
          )}
        >
          {exercise.title}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        <Badge variant={exercise.is_compulsory ? "default" : "secondary"}>
          {exercise.is_compulsory ? "Compulsory" : "Optional"}
        </Badge>
        <SubmissionStatusBadge status={submissionStatus} />
        {isLocked && <Lock className="h-4 w-4 text-[var(--state-locked)]" />}
      </span>
    </div>
  );

  if (isLocked) {
    const tooltip = prevModuleTitle
      ? `Unlocks when all compulsory items in "${prevModuleTitle}" are completed.`
      : "Complete all compulsory items in the previous module to unlock.";
    return (
      <Tooltip>
        <TooltipTrigger render={<div />}>{rowContent}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-64 text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={`/exercises/${exercise.id}`} className="block">
      {rowContent}
    </Link>
  );
}
