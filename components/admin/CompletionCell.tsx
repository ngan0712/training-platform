export type CellState = "done" | "in-progress" | "not-started" | "na";

type Props = {
  state: CellState;
  done: number;
  total: number;
};

const bgClass: Record<CellState, string> = {
  done: "bg-[var(--state-success)]",
  "in-progress": "bg-[var(--accent-primary)]",
  "not-started": "bg-[var(--bg-raised)]",
  na: "bg-muted/30",
};

const textClass: Record<CellState, string> = {
  done: "text-white",
  "in-progress": "text-white",
  "not-started": "text-[var(--text-muted)]",
  na: "text-muted-foreground/40",
};

export function CompletionCell({ state, done, total }: Props) {
  const label = state === "na" ? "N/A" : `${done}/${total}`;
  const title =
    state === "na" ? "Not applicable for this track" : `${done} of ${total} compulsory completed`;

  return (
    <div
      title={title}
      className={`flex h-9 w-14 items-center justify-center rounded text-xs font-medium ${bgClass[state]} ${textClass[state]}`}
    >
      {label}
    </div>
  );
}
