import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { adminGetSubmissions } from "@/lib/db/exerciseSubmissions";
import { getAllExercises } from "@/lib/db/exercises";
import { createServiceClient } from "@/lib/supabase/server";
import { UserRowSchema } from "@/lib/schemas/user";
import { SubmissionReviewQueue } from "@/components/admin/SubmissionReviewQueue";

export default async function AdminExercisesQueuePage() {
  await requireAdmin();

  const [submissions, exercises] = await Promise.all([adminGetSubmissions(), getAllExercises()]);

  // Fetch learner users for display names
  const supabase = createServiceClient();
  const { data: usersData } = await supabase
    .from("users")
    .select("id, email, name, role, track, created_at")
    .eq("role", "learner");

  const users = (usersData ?? []).map((r) => UserRowSchema.parse(r));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Exercise Submissions</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {submissions.filter((s) => s.status === "submitted").length} awaiting review
        </p>
      </div>
      <Suspense>
        <SubmissionReviewQueue submissions={submissions} exercises={exercises} users={users} />
      </Suspense>
    </div>
  );
}
