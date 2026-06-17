const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({ clicked, total }: { clicked: number; total: number }) {
  const ratio = total > 0 ? clicked / total : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden>
        {/* track */}
        <circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="8"
        />
        {/* progress */}
        <circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
        />
      </svg>
      <p className="text-muted-foreground text-sm">
        <span className="text-foreground font-semibold">{clicked}</span>
        {" / "}
        {total} compulsory
      </p>
    </div>
  );
}
