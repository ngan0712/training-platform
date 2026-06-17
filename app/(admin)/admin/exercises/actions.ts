"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { adminReviewSubmission, adminRevertSubmission } from "@/lib/db/exerciseSubmissions";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function reviewSubmission(
  submissionId: string,
  opts: { outcome: "pass" | "fail" | null; feedback: string | null }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await adminReviewSubmission(submissionId, admin.id, opts.outcome, opts.feedback);
    revalidatePath("/admin/exercises");
    revalidatePath(`/admin/exercises/${submissionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function revertSubmission(submissionId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminRevertSubmission(submissionId);
    revalidatePath("/admin/exercises");
    revalidatePath(`/admin/exercises/${submissionId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
