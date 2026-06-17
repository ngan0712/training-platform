"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MaterialTypeIcon } from "@/components/learner/MaterialTypeIcon";
import { cn } from "@/lib/utils";
import type { MaterialType } from "@/lib/schemas/material";

type Props = {
  materialId: string;
  title: string;
  type: MaterialType;
  isCompulsory: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  prevModuleTitle?: string;
};

export function MaterialRow({
  materialId,
  title,
  type,
  isCompulsory,
  isCompleted,
  isLocked,
  prevModuleTitle,
}: Props) {
  const router = useRouter();

  const rowContent = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-colors",
        isCompleted && "bg-[var(--bg-raised)]",
        !isLocked &&
          !isCompleted &&
          "hover:border-[var(--border-strong)] hover:bg-[var(--bg-raised)]",
        isLocked && "opacity-60"
      )}
    >
      <span
        className={cn(
          "text-muted-foreground shrink-0",
          isCompleted && "text-[var(--state-success)]",
          isLocked && "text-[var(--state-locked)]"
        )}
      >
        <MaterialTypeIcon type={type} className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-medium",
            isCompleted && "text-muted-foreground line-through",
            isLocked && "text-[var(--state-locked)]"
          )}
        >
          {title}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        <Badge variant={isCompulsory ? "default" : "secondary"}>
          {isCompulsory ? "Compulsory" : "Optional"}
        </Badge>
        {isCompleted && <CheckCircle2 className="h-4 w-4 text-[var(--state-success)]" />}
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
    <form
      method="POST"
      action="/api/track-click"
      target="_blank"
      rel="noopener noreferrer"
      onSubmit={() => setTimeout(() => router.refresh(), 800)}
    >
      <input type="hidden" name="materialId" value={materialId} />
      <button type="submit" className="w-full cursor-pointer text-left">
        {rowContent}
      </button>
    </form>
  );
}
