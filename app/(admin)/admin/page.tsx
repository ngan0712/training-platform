import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getCohortCompletionMatrix } from "@/lib/db/reports";
import { CompletionHeatmap } from "@/components/admin/CompletionHeatmap";
import { ExportButton } from "@/components/admin/ExportButton";

export default async function AdminPage() {
  const user = await requireAdmin();
  const matrix = await getCohortCompletionMatrix();

  const clicksByUser: Record<string, string[]> = {};
  for (const [userId, inner] of matrix.clicksByUser) {
    clicksByUser[userId] = Array.from(inner.keys());
  }

  // submissionsByUser: userId → exerciseId → status
  const submissionStatusByUser: Record<string, Record<string, string>> = {};
  for (const [userId, inner] of matrix.submissionsByUser) {
    submissionStatusByUser[userId] = Object.fromEntries(
      Array.from(inner.entries()).map(([exerciseId, sub]) => [exerciseId, sub.status])
    );
  }

  // passingAttemptsByUser: userId → array of quiz_ids passed
  const passingAttemptsByUser: Record<string, string[]> = {};
  for (const [userId, quizIds] of matrix.passingAttemptsByUser) {
    passingAttemptsByUser[userId] = Array.from(quizIds);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cohort Progress</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {matrix.users.length} learners · {matrix.modules.length} modules ·{" "}
            <span className="text-xs">{user.email}</span>
          </p>
        </div>
        <ExportButton />
      </div>
      <Suspense>
        <CompletionHeatmap
          users={matrix.users}
          modules={matrix.modules}
          materials={matrix.materials}
          exercises={matrix.exercises}
          quizzes={matrix.quizzes}
          clicksByUser={clicksByUser}
          submissionStatusByUser={submissionStatusByUser}
          passingAttemptsByUser={passingAttemptsByUser}
        />
      </Suspense>
    </div>
  );
}
