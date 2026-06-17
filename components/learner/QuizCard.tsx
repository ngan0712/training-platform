"use client";

import Link from "next/link";
import { Lock, GraduationCap, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { QuizRow, QuizAttemptRow } from "@/lib/schemas/quiz";

type Props = {
  quiz: QuizRow;
  latestAttempt: QuizAttemptRow | null;
  isLocked: boolean;
  prevModuleTitle?: string;
};

export function QuizCard({ quiz, latestAttempt, isLocked, prevModuleTitle }: Props) {
  const passed = latestAttempt?.passed ?? false;
  const attempted = latestAttempt !== null;

  const cardContent = (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-colors",
        passed && "bg-[var(--bg-raised)]",
        isLocked && "opacity-60"
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "text-muted-foreground shrink-0",
            passed && "text-[var(--state-success)]",
            isLocked && "text-[var(--state-locked)]"
          )}
        >
          <GraduationCap className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-medium",
              passed && "text-muted-foreground",
              isLocked && "text-[var(--state-locked)]"
            )}
          >
            {quiz.title}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <Badge variant="default">Compulsory</Badge>

          {passed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--state-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--state-success)]">
              <CheckCircle2 className="h-3 w-3" />
              Passed
            </span>
          )}

          {attempted && !passed && (
            <span className="bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
              <XCircle className="h-3 w-3" />
              {latestAttempt!.score_pct}%
            </span>
          )}

          {isLocked && <Lock className="h-4 w-4 text-[var(--state-locked)]" />}
        </span>
      </div>

      {/* Score line + action */}
      {!isLocked && (
        <div className="flex items-center justify-between gap-3 pl-8">
          {quiz.description && !attempted && (
            <p className="text-muted-foreground line-clamp-2 text-xs">{quiz.description}</p>
          )}
          {attempted && !passed && (
            <p className="text-muted-foreground text-xs">
              Score: {latestAttempt!.score_pct}% — need &gt;{quiz.pass_threshold}% to pass
            </p>
          )}
          {attempted && passed && (
            <p className="text-muted-foreground text-xs">Score: {latestAttempt!.score_pct}%</p>
          )}
          <span className="shrink-0">
            {!attempted ? (
              <Link href={`/quiz/${quiz.id}`} className={buttonVariants({ size: "sm" })}>
                Start Quiz
              </Link>
            ) : (
              <Link
                href={`/quiz/${quiz.id}?retake=1`}
                className={buttonVariants({ size: "sm", variant: passed ? "outline" : "default" })}
              >
                {passed ? "Retake" : "Retake Quiz"}
              </Link>
            )}
          </span>
        </div>
      )}
    </div>
  );

  if (isLocked) {
    const tooltip = prevModuleTitle
      ? `Unlocks when all compulsory items in "${prevModuleTitle}" are completed.`
      : "Complete all compulsory items in the previous module to unlock.";
    return (
      <Tooltip>
        <TooltipTrigger render={<div />}>{cardContent}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-64 text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return cardContent;
}
