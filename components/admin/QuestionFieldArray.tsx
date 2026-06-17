"use client";

import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { ExerciseFormValues } from "./ExerciseForm";

const QUESTION_TYPE_LABELS: Record<string, string> = {
  free_text: "Free text",
  single_choice: "Single choice",
  multi_choice: "Multiple choice",
  file_upload: "File upload",
  dropdown: "Dropdown",
};

const NEEDS_OPTIONS = new Set(["single_choice", "multi_choice", "dropdown"]);

type Props = {
  control: Control<ExerciseFormValues>;
  register: UseFormRegister<ExerciseFormValues>;
  errors: FieldErrors<ExerciseFormValues>;
};

export function QuestionFieldArray({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: "questions" });
  const questions = useWatch({ control, name: "questions" });

  const addQuestion = () =>
    append({
      question_type: "free_text",
      prompt: "",
      ref_answer: "",
      is_optional: false,
      options: [],
      conditional_on_question_index: null,
      conditional_on_value: "",
    });

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Questions</p>

      {fields.length === 0 && (
        <p className="text-muted-foreground text-xs">No questions yet. Add at least one.</p>
      )}

      {fields.map((field, i) => (
        <QuestionCard
          key={field.id}
          index={i}
          control={control}
          register={register}
          errors={errors}
          onRemove={() => remove(i)}
          allQuestions={questions ?? []}
        />
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
        <Plus className="mr-1 h-3 w-3" />
        Add question
      </Button>
    </div>
  );
}

type CardProps = {
  index: number;
  control: Control<ExerciseFormValues>;
  register: UseFormRegister<ExerciseFormValues>;
  errors: FieldErrors<ExerciseFormValues>;
  onRemove: () => void;
  allQuestions: ExerciseFormValues["questions"];
};

function QuestionCard({ index, control, register, errors, onRemove, allQuestions }: CardProps) {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `questions.${index}.options`,
  });

  const questionType = useWatch({ control, name: `questions.${index}.question_type` });
  const conditionalIndex = useWatch({
    control,
    name: `questions.${index}.conditional_on_question_index`,
  });

  const showOptions = NEEDS_OPTIONS.has(questionType);
  const priorQuestions = allQuestions.slice(0, index);
  const conditionalParent =
    conditionalIndex !== null && conditionalIndex !== undefined
      ? allQuestions[conditionalIndex]
      : null;
  const parentHasOptions = conditionalParent
    ? NEEDS_OPTIONS.has(conditionalParent.question_type)
    : false;

  return (
    <div className="space-y-3 rounded-lg border p-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical className="text-muted-foreground/40 h-4 w-4" />
          <span className="text-muted-foreground text-xs font-medium">Q{index + 1}</span>
        </div>
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

      {/* Type + Optional row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">Type</label>
          <Controller
            control={control}
            name={`questions.${index}.question_type`}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  if (v) field.onChange(v);
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUESTION_TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Required?</label>
          <Controller
            control={control}
            name={`questions.${index}.is_optional`}
            render={({ field }) => (
              <Select
                value={field.value ? "optional" : "required"}
                onValueChange={(v) => {
                  if (v) field.onChange(v === "optional");
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="space-y-1">
        <label className="text-xs font-medium">Question prompt</label>
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

      {/* Options (for choice types) */}
      {showOptions && (
        <div className="space-y-2">
          <label className="text-xs font-medium">Options</label>
          {optionFields.length === 0 && (
            <p className="text-muted-foreground text-xs">Add at least one option.</p>
          )}
          {optionFields.map((opt, oi) => (
            <div key={opt.id} className="flex items-center gap-1.5">
              <Input
                placeholder="Label (shown to user)"
                className="h-7 flex-1 text-xs"
                {...register(`questions.${index}.options.${oi}.label`)}
              />
              <Input
                placeholder="Value (stored)"
                className="h-7 w-28 text-xs"
                {...register(`questions.${index}.options.${oi}.value`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive h-7 w-7 shrink-0 p-0"
                onClick={() => removeOption(oi)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => appendOption({ label: "", value: "" })}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add option
          </Button>
        </div>
      )}

      {/* Conditional logic */}
      {index > 0 && (
        <div className="bg-muted/40 space-y-2 rounded-md p-2">
          <label className="text-muted-foreground text-xs font-medium">Show only if…</label>
          <div className="flex gap-2">
            <Controller
              control={control}
              name={`questions.${index}.conditional_on_question_index`}
              render={({ field }) => (
                <Select
                  value={
                    field.value !== null && field.value !== undefined ? String(field.value) : "none"
                  }
                  onValueChange={(v) => {
                    if (!v) return;
                    field.onChange(v === "none" ? null : parseInt(v, 10));
                  }}
                >
                  <SelectTrigger className="h-7 flex-1 text-xs">
                    <SelectValue placeholder="Always show" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Always show</SelectItem>
                    {priorQuestions.map((q, qi) => (
                      <SelectItem key={qi} value={String(qi)}>
                        Q{qi + 1}: {q.prompt.slice(0, 40) || "(no prompt)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            {conditionalParent &&
              (parentHasOptions ? (
                <Controller
                  control={control}
                  name={`questions.${index}.conditional_on_value`}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={(v) => {
                        if (v) field.onChange(v);
                      }}
                    >
                      <SelectTrigger className="h-7 flex-1 text-xs">
                        <SelectValue placeholder="= value" />
                      </SelectTrigger>
                      <SelectContent>
                        {(conditionalParent.options ?? []).map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <Input
                  placeholder="= value"
                  className="h-7 flex-1 text-xs"
                  {...register(`questions.${index}.conditional_on_value`)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Reference answer (not shown to learners) */}
      {questionType !== "file_upload" && (
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">
            Reference answer <span className="font-normal">(admin only)</span>
          </label>
          <Input
            placeholder="Optional"
            className="h-7 text-xs"
            {...register(`questions.${index}.ref_answer`)}
          />
        </div>
      )}
    </div>
  );
}
