"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form } from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { QuestionFieldArray } from "./QuestionFieldArray";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { ExerciseQuestionRow } from "@/lib/schemas/exerciseQuestion";
import { createExercise, updateExercise } from "@/app/(admin)/admin/modules/[id]/exercises/actions";

export const OptionSchema = z.object({
  label: z.string().min(1, "Required"),
  value: z.string().min(1, "Required"),
});

export const QuestionSchema = z.object({
  question_type: z.enum(["free_text", "single_choice", "multi_choice", "file_upload", "dropdown"]),
  prompt: z.string().min(1, "Required"),
  ref_answer: z.string(),
  is_optional: z.boolean(),
  options: z.array(OptionSchema),
  // Index into the questions array (null = not conditional)
  conditional_on_question_index: z.number().nullable(),
  conditional_on_value: z.string(),
});

export const ExerciseFormSchema = z.object({
  title: z.string().min(1, "Required"),
  prompt: z.string(),
  is_compulsory: z.boolean(),
  order: z.number().int().min(1),
  questions: z.array(QuestionSchema),
});

export type ExerciseFormValues = z.infer<typeof ExerciseFormSchema>;

type Props = {
  moduleId: string;
  exercise?: ExerciseRow;
  existingQuestions?: ExerciseQuestionRow[];
  nextOrder: number;
  onSuccess: () => void;
};

export function ExerciseForm({
  moduleId,
  exercise,
  existingQuestions = [],
  nextOrder,
  onSuccess,
}: Props) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(ExerciseFormSchema),
    defaultValues: exercise
      ? {
          title: exercise.title,
          prompt: exercise.prompt,
          is_compulsory: exercise.is_compulsory,
          order: exercise.order,
          questions: existingQuestions.map((q) => ({
            question_type: q.question_type,
            prompt: q.prompt,
            ref_answer: q.ref_answer ?? "",
            is_optional: q.is_optional,
            options: q.options.map((o) => ({ label: o.label, value: o.value })),
            conditional_on_question_index: q.conditional_on_question_id
              ? existingQuestions.findIndex((eq) => eq.id === q.conditional_on_question_id)
              : null,
            conditional_on_value: q.conditional_on_value ?? "",
          })),
        }
      : {
          title: "",
          prompt: "",
          is_compulsory: true,
          order: nextOrder,
          questions: [],
        },
  });

  function onSubmit(values: ExerciseFormValues) {
    startTransition(async () => {
      const result = exercise
        ? await updateExercise(exercise.id, values, existingQuestions)
        : await createExercise(moduleId, values);
      if (result.ok) {
        toast.success(exercise ? "Exercise updated" : "Exercise created");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Title</label>
        <Input placeholder="Exercise title" {...register("title")} />
        {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Prompt / instructions</label>
        <Textarea rows={3} placeholder="What learners should do…" {...register("prompt")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Compulsory?</label>
          <Controller
            control={control}
            name="is_compulsory"
            render={({ field }) => (
              <Select
                value={field.value ? "true" : "false"}
                onValueChange={(v) => {
                  if (v) field.onChange(v === "true");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes — gates module unlock</SelectItem>
                  <SelectItem value="false">No — optional</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Order</label>
          <Input type="number" min={1} {...register("order", { valueAsNumber: true })} />
          {errors.order && <p className="text-destructive text-xs">{errors.order.message}</p>}
        </div>
      </div>

      <QuestionFieldArray control={control} register={register} errors={errors} />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : exercise ? "Update exercise" : "Create exercise"}
      </Button>
    </Form>
  );
}
