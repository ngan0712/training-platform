import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getSubmissionById, adminGetAnswersForSubmission } from "@/lib/db/exerciseSubmissions";
import { getExerciseById, adminGetQuestionsForExercise } from "@/lib/db/exercises";
import { createServiceClient } from "@/lib/supabase/server";
import { UserRowSchema } from "@/lib/schemas/user";
import { SubmissionReviewForm } from "@/components/admin/SubmissionReviewForm";

type Props = { params: Promise<{ submissionId: string }> };

export default async function AdminSubmissionReviewPage({ params }: Props) {
  const { submissionId } = await params;
  await requireAdmin();

  const submission = await getSubmissionById(submissionId);
  if (!submission) notFound();

  const [exercise, answers] = await Promise.all([
    getExerciseById(submission.exercise_id),
    adminGetAnswersForSubmission(submissionId),
  ]);
  if (!exercise) notFound();

  const questions = await adminGetQuestionsForExercise(exercise.id);

  const supabase = createServiceClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, email, name, role, track, created_at")
    .eq("id", submission.user_id)
    .single();

  const learner = userData ? UserRowSchema.safeParse(userData) : null;
  if (!learner?.success) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav>
        <Link
          href="/admin/exercises"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to submissions
        </Link>
      </nav>

      <SubmissionReviewForm
        submission={submission}
        exercise={exercise}
        learner={learner.data}
        questions={questions}
        answers={answers}
      />
    </div>
  );
}
