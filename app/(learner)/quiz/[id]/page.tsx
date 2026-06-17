import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireLearner } from "@/lib/auth/session";
import { getQuizById, getLatestAttemptResult } from "@/lib/db/quizzes";
import { QuizTakeForm } from "@/components/learner/QuizTakeForm";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function QuizPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { retake } = await searchParams;
  const user = await requireLearner();

  const quiz = await getQuizById(id);
  if (!quiz) notFound();

  // Load latest attempt result unless the learner explicitly wants a retake.
  const latestResult = retake ? null : await getLatestAttemptResult(id, user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav aria-label="breadcrumb">
        <Link
          href={`/modules/${quiz.module_id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to module
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-semibold">{quiz.title}</h1>
        <p className="text-muted-foreground mt-1 text-xs">
          Pass at &gt;{quiz.pass_threshold}% · {quiz.questions.length} question
          {quiz.questions.length !== 1 ? "s" : ""}
        </p>
      </header>

      <QuizTakeForm quiz={quiz} initialResult={latestResult} />
    </div>
  );
}
