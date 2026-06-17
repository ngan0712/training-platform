// Hardcoded cohort dates — update with real values once HR confirms.
// All times are Singapore time (UTC+8).

export const COHORT_START = new Date("2026-06-01T00:00:00+08:00");
export const COHORT_END = new Date("2026-07-31T23:59:59+08:00");

// End of Week 5 — approximate. Confirm exact date before launch.
export const GROUP_SUBMISSION_CUTOFF = new Date("2026-07-03T23:59:59+08:00");

export function isPastGroupCutoff(now: Date = new Date()): boolean {
  return now > GROUP_SUBMISSION_CUTOFF;
}

export function isGroupFormationOpen(now: Date = new Date()): boolean {
  return !isPastGroupCutoff(now);
}
