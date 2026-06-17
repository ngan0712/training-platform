"use client";

import { useTransition } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form } from "@/components/ui/form";
import { createQuiz, updateQuiz } from "@/app/(admin)/admin/modules/[id]/quiz/actions";
import {
  QuizFormSchema,
  type QuizFormValues,
  type QuizWithQuestionsAdmin,
} from "@/lib/schemas/quiz";

type Props = {
  moduleId: string;
  quiz?: QuizWithQuestionsAdmin;
  onSuccess: () => void;
};

export function QuizForm({ moduleId, quiz, onSuccess }: Props) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QuizFormValues>({
    resolver: zodResolver(QuizFormSchema),
    defaultValues: quiz
      ? {
          title: quiz.title,
          description: quiz.description ?? "",
          pass_threshold: quiz.pass_threshold,
          order: quiz.order,
          questions: quiz.questions.map((q) => ({
            prompt: q.prompt,
            explanation: q.explanation ?? "",
            options: q.options.map((o) => ({ label: o.label })),
            correctOptionIndex: q.options.findIndex((o) => o.is_correct),
          })),
        }
      : {
          title: "",
          description: "",
          pass_threshold: 80,
          order: 1,
          questions: [],
        },
  });

  const {
    fields: qFields,
    append: appendQ,
    remove: removeQ,
  } = useFieldArray({
    control,
    name: "questions",
  });

  function onSubmit(values: QuizFormValues) {
    startTransition(async () => {
      const result = quiz ? await updateQuiz(quiz.id, values) : await createQuiz(moduleId, values);
      if (result.ok) {
        toast.success(quiz ? "Quiz updated" : "Quiz created");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Title</label>
        <Input placeholder="Quiz title" {...register("title")} />
        {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Textarea
          rows={2}
          placeholder="Brief intro shown before the quiz…"
          {...register("description")}
        />
      </div>

      {/* Pass threshold + order */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Pass threshold (%)</label>
          <Input
            type="number"
            min={1}
            max={100}
            {...register("pass_threshold", { valueAsNumber: true })}
          />
          {errors.pass_threshold && (
            <p className="text-destructive text-xs">{errors.pass_threshold.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Order</label>
          <Input type="number" min={1} {...register("order", { valueAsNumber: true })} />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Questions</p>
        {typeof (errors.questions as { message?: string } | undefined)?.message === "string" && (
          <p className="text-destructive text-xs">
            {(errors.questions as { message?: string }).message}
          </p>
        )}

        {qFields.length === 0 && (
          <p className="text-muted-foreground text-xs">No questions yet. Add at least one.</p>
        )}

        {qFields.map((field, qi) => (
          <QuestionCard
            key={field.id}
            index={qi}
            control={control}
            register={register}
            errors={errors}
            onRemove={() => removeQ(qi)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendQ({
              prompt: "",
              explanation: "",
              options: [{ label: "" }, { label: "" }],
              correctOptionIndex: 0,
            })
          }
        >
          <Plus className="mr-1 h-3 w-3" />
          Add question
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : quiz ? "Update quiz" : "Create quiz"}
      </Button>
    </Form>
  );
}

type CardProps = {
  index: number;
  control: ReturnType<typeof useForm<QuizFormValues>>["control"];
  register: ReturnType<typeof useForm<QuizFormValues>>["register"];
  errors: ReturnType<typeof useForm<QuizFormValues>>["formState"]["errors"];
  onRemove: () => void;
};

function QuestionCard({ index, control, register, errors, onRemove }: CardProps) {
  const {
    fields: optFields,
    append: appendOpt,
    remove: removeOpt,
  } = useFieldArray({
    control,
    name: `questions.${index}.options`,
  });

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">Q{index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive h-6 w-6 p-0"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Prompt */}
      <div className="space-y-1">
        <label className="text-xs font-medium">Question</label>
        <Textarea
          rows={2}
          placeholder="What is…?"
          className="text-sm"
          {...register(`questions.${index}.prompt`)}
        />
        {errors.questions?.[index]?.prompt && (
          <p className="text-destructive text-xs">{errors.questions[index]?.prompt?.message}</p>
        )}
      </div>

      {/* Explanation */}
      <div className="space-y-1">
        <label className="text-muted-foreground text-xs font-medium">
          Explanation{" "}
          <span className="font-normal">(shown under wrong answers after submission)</span>
        </label>
        <Input
          placeholder="Optional"
          className="h-7 text-xs"
          {...register(`questions.${index}.explanation`)}
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="text-xs font-medium">
          Options —{" "}
          <span className="text-muted-foreground font-normal">
            click the dot to mark the correct answer
          </span>
        </label>
        {optFields.map((opt, oi) => (
          <Controller
            key={opt.id}
            control={control}
            name={`questions.${index}.correctOptionIndex`}
            render={({ field }) => (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => field.onChange(oi)}
                  className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                    field.value === oi ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}
                  aria-label={`Mark option ${oi + 1} as correct`}
                />
                <Input
                  placeholder={`Option ${oi + 1}`}
                  className="h-7 flex-1 text-xs"
                  {...register(`questions.${index}.options.${oi}.label`)}
                />
                {optFields.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-7 w-7 shrink-0 p-0"
                    onClick={() => {
                      removeOpt(oi);
                      // Adjust correctOptionIndex if needed
                      if (field.value === oi) field.onChange(0);
                      else if (field.value > oi) field.onChange(field.value - 1);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          />
        ))}
        {optFields.length < 6 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => appendOpt({ label: "" })}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add option
          </Button>
        )}
      </div>
    </div>
  );
}
