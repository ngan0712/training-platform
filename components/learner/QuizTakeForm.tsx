"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitQuizAttempt } from "@/app/(learner)/quiz/[id]/actions";
import type { QuizWithQuestions, QuizAttemptResult } from "@/lib/schemas/quiz";

type Props = {
  quiz: QuizWithQuestions;
  initialResult?: QuizAttemptResult | null;
};

export function QuizTakeForm({ quiz, initialResult = null }: Props) {
  const [result, setResult] = useState<QuizAttemptResult | null>(initialResult);
  // Map of questionId → selected optionId
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const allAnswered = quiz.questions.every((q) => selected[q.id]);

  function handleSubmit() {
    if (!allAnswered) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    const answers = quiz.questions.map((q) => ({
      questionId: q.id,
      optionId: selected[q.id],
    }));

    startTransition(async () => {
      const res = await submitQuizAttempt(quiz.id, answers);
      if (res.ok) {
        setResult(res.result);
      } else {
        toast.error(res.error);
      }
    });
  }

  if (result) {
    return (
      <QuizResultScreen
        quiz={quiz}
        result={result}
        onRetake={() => {
          setResult(null);
          setSelected({});
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {quiz.description && <p className="bg-muted rounded-lg p-4 text-sm">{quiz.description}</p>}

      {quiz.questions.map((q, i) => (
        <div key={q.id} className="space-y-3">
          <p className="text-sm font-medium">
            {i + 1}. {q.prompt}
          </p>
          <div className="flex flex-col gap-2">
            {q.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected((prev) => ({ ...prev, [q.id]: opt.id }))}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                  selected[q.id] === opt.id
                    ? "border-primary bg-primary/5 font-medium"
                    : "hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full border-2",
                    selected[q.id] === opt.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40"
                  )}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <Button onClick={handleSubmit} disabled={!allAnswered || pending} className="w-full">
        {pending ? "Submitting…" : "Submit Quiz"}
      </Button>
    </div>
  );
}

type ResultProps = {
  quiz: QuizWithQuestions;
  result: QuizAttemptResult;
  onRetake: () => void;
};

function QuizResultScreen({ quiz, result, onRetake }: ResultProps) {
  const { score_pct, passed } = result;

  return (
    <div className="space-y-6">
      {/* Score banner */}
      <div
        className={cn(
          "space-y-1 rounded-xl border p-5 text-center",
          passed
            ? "border-[var(--state-success)]/30 bg-[var(--state-success)]/5"
            : "border-destructive/30 bg-destructive/5"
        )}
      >
        <p className="text-3xl font-bold">{score_pct}%</p>
        <p
          className={cn(
            "text-sm font-medium",
            passed ? "text-[var(--state-success)]" : "text-destructive"
          )}
        >
          {passed
            ? "Passed — great work!"
            : `Not passed — you need >${quiz.pass_threshold}% to pass`}
        </p>
        <p className="text-muted-foreground text-xs">
          Attempt #{result.attempt_number} ·{" "}
          {result.question_results.filter((r) => r.is_correct).length}/
          {result.question_results.length} correct
        </p>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        {result.question_results.map((qr, i) => (
          <div
            key={qr.question_id}
            className={cn(
              "space-y-2 rounded-lg border p-4",
              qr.is_correct ? "border-[var(--state-success)]/30" : "border-destructive/20"
            )}
          >
            <div className="flex items-start gap-2">
              {qr.is_correct ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--state-success)]" />
              ) : (
                <XCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
              )}
              <p className="text-sm font-medium">
                {i + 1}. {qr.prompt}
              </p>
            </div>

            <div className="text-muted-foreground space-y-1 pl-6 text-xs">
              <p>
                Your answer:{" "}
                <span
                  className={cn(
                    "font-medium",
                    qr.is_correct ? "text-[var(--state-success)]" : "text-destructive"
                  )}
                >
                  {qr.selected_label}
                </span>
              </p>
              {!qr.is_correct && (
                <p>
                  Correct answer:{" "}
                  <span className="text-foreground font-medium">{qr.correct_label}</span>
                </p>
              )}
              {!qr.is_correct && qr.explanation && (
                <p className="bg-muted mt-1 rounded px-2 py-1.5 text-xs">{qr.explanation}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/modules/${quiz.module_id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to module
        </Link>
        <Button onClick={onRetake} variant={passed ? "outline" : "default"}>
          Retake Quiz
        </Button>
      </div>
    </div>
  );
}
