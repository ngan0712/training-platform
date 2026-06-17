import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireLearner } from "@/lib/auth/session";
import { getExerciseById, getQuestionsForExercise } from "@/lib/db/exercises";
import { getSubmissionForUser, getAnswersForSubmission } from "@/lib/db/exerciseSubmissions";
import { ExerciseForm } from "@/components/learner/ExerciseForm";

type Props = { params: Promise<{ id: string }> };

export default async function ExercisePage({ params }: Props) {
  const { id } = await params;
  const user = await requireLearner();

  const exercise = await getExerciseById(id);
  if (!exercise) notFound();

  const [submission, questions] = await Promise.all([
    getSubmissionForUser(id, user.id),
    getQuestionsForExercise(id),
  ]);

  const answers = submission ? await getAnswersForSubmission(submission.id) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav aria-label="breadcrumb">
        <Link
          href={`/modules/${exercise.module_id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to module
        </Link>
      </nav>

      <ExerciseForm
        exercise={exercise}
        questions={questions}
        submission={submission}
        existingAnswers={answers}
      />
    </div>
  );
}
