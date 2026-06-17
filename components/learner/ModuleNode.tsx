import Link from "next/link";
import { Lock, CheckCircle2, Circle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ModuleCompletion } from "@/lib/domain/completion";

type NodeState = "done" | "current" | "locked";

const RING_R = 19;
const RING_CIRC = 2 * Math.PI * RING_R;

export function ModuleNode({
  id,
  title,
  weekNumber,
  state,
  prevModuleTitle,
  completion,
}: {
  id: string;
  title: string;
  weekNumber: number;
  state: NodeState;
  prevModuleTitle?: string;
  completion?: ModuleCompletion;
}) {
  const ratio =
    completion && completion.compulsoryTotal > 0
      ? Math.min(completion.compulsoryClicked / completion.compulsoryTotal, 1)
      : state === "done"
        ? 1
        : 0;
  const offset = RING_CIRC * (1 - ratio);

  const showArc = (state === "done" || state === "current") && ratio > 0;
  const arcColor = state === "done" ? "var(--state-success)" : "var(--accent-primary)";

  const icon = {
    done: <CheckCircle2 className="h-4 w-4 text-[var(--state-success)]" />,
    current: <Circle className="fill-primary text-primary h-3 w-3" />,
    locked: <Lock className="h-3.5 w-3.5 text-[var(--state-locked)]" />,
  }[state];

  const nodeContent = (
    <div
      className={cn(
        "flex w-24 shrink-0 flex-col items-center gap-1.5",
        state === "locked" && "opacity-60"
      )}
    >
      {/* Ring + icon */}
      <div className="relative h-11 w-11">
        <svg width="44" height="44" viewBox="0 0 44 44" className="absolute inset-0" aria-hidden>
          {/* Track ring */}
          <circle
            cx="22"
            cy="22"
            r={RING_R}
            fill="none"
            stroke="var(--border-default)"
            strokeWidth="3.5"
          />
          {/* Progress arc */}
          {showArc && (
            <circle
              cx="22"
              cy="22"
              r={RING_R}
              fill="none"
              stroke={arcColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={offset}
              transform="rotate(-90 22 22)"
            />
          )}
        </svg>
        {/* Inner fill + icon */}
        <div
          className={cn(
            "absolute inset-[5px] flex items-center justify-center rounded-full",
            state === "done" && "bg-[var(--state-success)]/10",
            state === "current" && "bg-primary/10",
            state === "locked" && "bg-muted"
          )}
        >
          {icon}
        </div>
      </div>

      <p className="text-muted-foreground text-center text-xs leading-tight">W{weekNumber}</p>
      <p
        className={cn(
          "line-clamp-2 text-center text-xs leading-tight",
          state === "locked" ? "text-muted-foreground" : "text-foreground font-medium"
        )}
      >
        {title}
      </p>
    </div>
  );

  if (state === "locked") {
    const tooltipText = prevModuleTitle
      ? `Finish the compulsory items in "${prevModuleTitle}" to unlock`
      : "Complete the previous module to unlock";
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="cursor-default" />}>{nodeContent}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-52 text-center text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={`/modules/${id}`}
      className="focus-visible:ring-primary rounded-md focus-visible:ring-2 focus-visible:outline-none"
    >
      {nodeContent}
    </Link>
  );
}
