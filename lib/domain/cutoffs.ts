// All times are Singapore time (UTC+8).

import { getAppSettings } from "@/lib/db/appSettings";

export const COHORT_START = new Date("2026-06-01T00:00:00+08:00");
export const COHORT_END = new Date("2026-07-31T23:59:59+08:00");

// Admin-editable via /admin/settings — see app_settings table (migration 0018).
export async function isPastGroupCutoff(now: Date = new Date()): Promise<boolean> {
  const { group_submission_cutoff } = await getAppSettings();
  return now > new Date(group_submission_cutoff);
}

export async function isGroupFormationOpen(now: Date = new Date()): Promise<boolean> {
  return !(await isPastGroupCutoff(now));
}
