"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form } from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SubmissionStatusBadge } from "@/components/learner/SubmissionStatusBadge";
import type { ExerciseSubmissionRow } from "@/lib/schemas/exerciseSubmission";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { ExerciseQuestionRow } from "@/lib/schemas/exerciseQuestion";
import type { ExerciseAnswerRow } from "@/lib/schemas/exerciseAnswer";
import type { UserRow } from "@/lib/schemas/user";
import { reviewSubmission, revertSubmission } from "@/app/(admin)/admin/exercises/actions";

const ReviewSchema = z.object({
  outcome: z.enum(["pass", "fail", "none"]),
  feedback: z.string(),
});
type ReviewValues = z.infer<typeof ReviewSchema>;

type Props = {
  submission: ExerciseSubmissionRow;
  exercise: ExerciseRow;
  learner: UserRow;
  questions: ExerciseQuestionRow[];
  answers: ExerciseAnswerRow[];
};

export function SubmissionReviewForm({ submission, exercise, learner, questions, answers }: Props) {
  const [pending, startTransition] = useTransition();

  const { register, control, handleSubmit } = useForm<ReviewValues>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: {
      outcome: submission.outcome ?? "none",
      feedback: submission.feedback ?? "",
    },
  });

  function onReview(values: ReviewValues) {
    startTransition(async () => {
      const result = await reviewSubmission(submission.id, {
        outcome: values.outcome === "none" ? null : values.outcome,
        feedback: values.feedback || null,
      });
      if (result.ok) {
        toast.success("Marked as reviewed");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRevert() {
    startTransition(async () => {
      const result = await revertSubmission(submission.id);
      if (result.ok) {
        toast.success("Submission reverted to draft");
      } else {
        toast.error(result.error);
      }
    });
  }

  const answerByQuestion = new Map(answers.map((a) => [a.question_id, a]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{exercise.title}</h2>
          <p className="text-muted-foreground text-sm">{learner.name || learner.email}</p>
        </div>
        <SubmissionStatusBadge status={submission.status} />
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, i) => {
            const answer = answerByQuestion.get(q.id);
            return (
              <div key={q.id} className="space-y-1">
                <p className="text-sm font-medium">
                  {i + 1}. {q.prompt}
                  {q.is_optional && (
                    <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                      (optional)
                    </span>
                  )}
                </p>
                <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">
                  {q.question_type === "file_upload" ? (
                    answer?.answer_text ? (
                      <span className="font-mono text-xs">{answer.answer_text}</span>
                    ) : (
                      <span className="text-muted-foreground italic">No file uploaded</span>
                    )
                  ) : (
                    answer?.answer_text || (
                      <span className="text-muted-foreground italic">No answer</span>
                    )
                  )}
                </div>
                {q.ref_answer && (
                  <p className="text-muted-foreground text-xs">
                    <span className="font-medium">Reference:</span> {q.ref_answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Form onSubmit={handleSubmit(onReview)}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Outcome</label>
          <Controller
            control={control}
            name="outcome"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No outcome</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Feedback (optional)</label>
          <Textarea
            rows={4}
            placeholder="Leave feedback for the learner…"
            {...register("feedback")}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Mark reviewed"}
          </Button>
          {(submission.status === "submitted" || submission.status === "reviewed") && (
            <Button type="button" variant="outline" disabled={pending} onClick={handleRevert}>
              Send back to draft
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
