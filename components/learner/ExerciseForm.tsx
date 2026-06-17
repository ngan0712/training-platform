"use client";

import { useTransition, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
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
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { ExerciseQuestionPublic } from "@/lib/schemas/exerciseQuestion";
import type { ExerciseSubmissionRow } from "@/lib/schemas/exerciseSubmission";
import type { ExerciseAnswerRow } from "@/lib/schemas/exerciseAnswer";
import {
  saveDraft,
  submitExercise,
  uploadQuestionFile,
} from "@/app/(learner)/exercises/[id]/actions";

type Props = {
  exercise: ExerciseRow;
  questions: ExerciseQuestionPublic[];
  submission: ExerciseSubmissionRow | null;
  existingAnswers: ExerciseAnswerRow[];
};

// Returns true if this question should be shown given current form values
function isVisible(
  question: ExerciseQuestionPublic,
  questions: ExerciseQuestionPublic[],
  values: Record<string, string | string[]>
): boolean {
  if (!question.conditional_on_question_id) return true;
  const parent = questions.find((q) => q.id === question.conditional_on_question_id);
  if (!parent || question.conditional_on_value === null) return true;

  const parentValue = values[parent.id];
  if (Array.isArray(parentValue)) {
    return parentValue.includes(question.conditional_on_value);
  }
  return parentValue === question.conditional_on_value;
}

function buildSchema(questions: ExerciseQuestionPublic[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of questions) {
    if (q.question_type === "file_upload") continue; // handled separately
    if (q.question_type === "multi_choice") {
      shape[q.id] = z.array(z.string());
    } else {
      shape[q.id] = z.string();
    }
  }
  return z.object(shape);
}

export function ExerciseForm({ exercise, questions, submission, existingAnswers }: Props) {
  const [pending, startTransition] = useTransition();
  const isReadOnly = submission?.status === "submitted" || submission?.status === "reviewed";

  // Track uploaded file paths for file_upload questions (questionId → filePath)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const a of existingAnswers) {
      const q = questions.find((q) => q.id === a.question_id);
      if (q?.question_type === "file_upload" && a.answer_text) {
        init[a.question_id] = a.answer_text;
      }
    }
    return init;
  });
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const schema = buildSchema(questions);
  type FormValues = z.infer<typeof schema>;

  const defaults = Object.fromEntries(
    questions
      .filter((q) => q.question_type !== "file_upload")
      .map((q) => {
        const existing = existingAnswers.find((a) => a.question_id === q.id)?.answer_text ?? "";
        if (q.question_type === "multi_choice") {
          try {
            return [q.id, JSON.parse(existing)];
          } catch {
            return [q.id, []];
          }
        }
        return [q.id, existing];
      })
  ) as FormValues;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const watchedValues = useWatch({ control }) as Record<string, string | string[]>;

  function collectAnswers(values: FormValues): { questionId: string; answerText: string }[] {
    return questions
      .filter((q) => q.question_type !== "file_upload")
      .filter((q) => isVisible(q, questions, watchedValues))
      .map((q) => {
        const val = (values as Record<string, string | string[]>)[q.id];
        const answerText = Array.isArray(val) ? JSON.stringify(val) : (val ?? "");
        return { questionId: q.id, answerText };
      });
  }

  function handleSaveDraft(values: FormValues) {
    startTransition(async () => {
      const answers = collectAnswers(values);
      const result = await saveDraft(exercise.id, answers);
      if (result.ok) toast.success("Draft saved");
      else toast.error(result.error);
    });
  }

  function handleSubmitExercise(values: FormValues) {
    // Validate visible required questions
    const visibleRequired = questions.filter(
      (q) => !q.is_optional && isVisible(q, questions, watchedValues)
    );

    for (const q of visibleRequired) {
      if (q.question_type === "file_upload") {
        if (!uploadedFiles[q.id]) {
          toast.error(`Please upload a file for: "${q.prompt.slice(0, 60)}"`);
          return;
        }
      } else {
        const val = (values as Record<string, string | string[]>)[q.id];
        const isEmpty = Array.isArray(val) ? val.length === 0 : !val?.trim();
        if (isEmpty) {
          toast.error("Please answer all required questions before submitting.");
          return;
        }
      }
    }

    startTransition(async () => {
      const answers = collectAnswers(values);
      const result = await submitExercise(exercise.id, answers);
      if (result.ok) toast.success("Exercise submitted");
      else toast.error(result.error);
    });
  }

  async function handleFileUpload(questionId: string, file: File) {
    setUploadingFor(questionId);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadQuestionFile(exercise.id, questionId, formData);
    setUploadingFor(null);
    if (result.ok && result.filePath) {
      setUploadedFiles((prev) => ({ ...prev, [questionId]: result.filePath! }));
      toast.success("File uploaded");
    } else if (!result.ok) {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{exercise.title}</h2>
        <SubmissionStatusBadge status={submission?.status ?? null} />
      </div>

      {exercise.prompt && <p className="bg-muted rounded-lg p-4 text-sm">{exercise.prompt}</p>}

      {submission?.status === "reviewed" && submission.feedback && (
        <div className="space-y-1 rounded-lg border bg-[var(--bg-raised)] p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Reviewer feedback
          </p>
          <p className="text-sm">{submission.feedback}</p>
          {submission.outcome && (
            <p className="text-muted-foreground text-xs font-medium capitalize">
              Outcome: {submission.outcome}
            </p>
          )}
        </div>
      )}

      <Form onSubmit={handleSubmit(handleSaveDraft)}>
        <div className="space-y-6">
          {questions.map((q, i) => {
            const visible = isVisible(q, questions, watchedValues);
            if (!visible) return null;
            const label = (
              <label className="text-sm font-medium" htmlFor={`q-${q.id}`}>
                {i + 1}. {q.prompt}
                {q.is_optional && (
                  <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                    (optional)
                  </span>
                )}
              </label>
            );
            const err = (errors as Record<string, { message?: string } | undefined>)[q.id];

            return (
              <div key={q.id} className="space-y-1.5">
                {label}

                {q.question_type === "free_text" && (
                  <Controller
                    control={control}
                    name={q.id as never}
                    render={({ field }) => (
                      <Textarea
                        id={`q-${q.id}`}
                        rows={4}
                        disabled={isReadOnly}
                        placeholder={isReadOnly ? "" : "Your answer…"}
                        value={field.value as string}
                        onChange={field.onChange}
                      />
                    )}
                  />
                )}

                {(q.question_type === "single_choice" || q.question_type === "dropdown") && (
                  <Controller
                    control={control}
                    name={q.id as never}
                    render={({ field }) =>
                      q.question_type === "dropdown" ? (
                        <Select
                          value={(field.value as string) || ""}
                          onValueChange={(v) => {
                            if (v) field.onChange(v);
                          }}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger id={`q-${q.id}`} className="w-full">
                            <SelectValue placeholder="Select an option…" />
                          </SelectTrigger>
                          <SelectContent>
                            {q.options.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        // single_choice: radio-style buttons
                        <div className="flex flex-col gap-2">
                          {q.options.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => !isReadOnly && field.onChange(o.value)}
                              className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                                (field.value as string) === o.value
                                  ? "border-primary bg-primary/5 font-medium"
                                  : "hover:bg-muted/50"
                              } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
                            >
                              <span
                                className={`h-4 w-4 shrink-0 rounded-full border-2 ${(field.value as string) === o.value ? "border-primary bg-primary" : "border-muted-foreground/40"}`}
                              />
                              {o.label}
                            </button>
                          ))}
                        </div>
                      )
                    }
                  />
                )}

                {q.question_type === "multi_choice" && (
                  <Controller
                    control={control}
                    name={q.id as never}
                    render={({ field }) => {
                      const selected = (field.value as string[]) ?? [];
                      function toggle(v: string) {
                        if (isReadOnly) return;
                        field.onChange(
                          selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]
                        );
                      }
                      return (
                        <div className="flex flex-col gap-2">
                          {q.options.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => toggle(o.value)}
                              className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                                selected.includes(o.value)
                                  ? "border-primary bg-primary/5 font-medium"
                                  : "hover:bg-muted/50"
                              } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${selected.includes(o.value) ? "border-primary bg-primary" : "border-muted-foreground/40"}`}
                              >
                                {selected.includes(o.value) && (
                                  <svg
                                    viewBox="0 0 10 8"
                                    className="text-primary-foreground h-2.5 w-2.5 fill-current"
                                  >
                                    <path
                                      d="M1 4l3 3 5-6"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </span>
                              {o.label}
                            </button>
                          ))}
                        </div>
                      );
                    }}
                  />
                )}

                {q.question_type === "file_upload" && (
                  <div className="space-y-2">
                    {uploadedFiles[q.id] ? (
                      <div className="bg-muted/30 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--state-success)]" />
                        <span className="truncate font-mono text-xs">
                          {uploadedFiles[q.id].split("/").pop()}
                        </span>
                        {!isReadOnly && (
                          <span className="text-muted-foreground ml-auto text-xs">
                            Upload a new file to replace
                          </span>
                        )}
                      </div>
                    ) : (
                      !isReadOnly && (
                        <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-sm">
                          <FileText className="mx-auto h-6 w-6" />
                        </div>
                      )
                    )}
                    {!isReadOnly && (
                      <label className="hover:bg-muted/50 flex w-fit cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                        <Upload className="h-4 w-4" />
                        {uploadingFor === q.id ? "Uploading…" : "Choose file"}
                        <input
                          type="file"
                          className="sr-only"
                          disabled={uploadingFor === q.id}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(q.id, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                )}

                {err && <p className="text-destructive text-xs">{err.message}</p>}
              </div>
            );
          })}
        </div>

        {!isReadOnly && (
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? "Saving…" : "Save draft"}
            </Button>
            <Button type="button" disabled={pending} onClick={handleSubmit(handleSubmitExercise)}>
              {pending ? "Submitting…" : "Submit"}
            </Button>
          </div>
        )}
      </Form>
    </div>
  );
}
