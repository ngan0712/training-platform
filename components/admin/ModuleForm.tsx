"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CreateModuleSchema, type CreateModuleInput, type ModuleRow } from "@/lib/schemas/module";
import { createModule, updateModule } from "@/app/(admin)/admin/modules/actions";

type Props = {
  module?: ModuleRow;
  onSuccess: () => void;
};

export function ModuleForm({ module, onSuccess }: Props) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateModuleInput>({
    resolver: zodResolver(CreateModuleSchema),
    defaultValues: module
      ? {
          title: module.title,
          description: module.description,
          week_number: module.week_number,
          order: module.order,
        }
      : { week_number: 1, order: 1, description: "" },
  });

  function onSubmit(values: CreateModuleInput) {
    startTransition(async () => {
      const result = module ? await updateModule(module.id, values) : await createModule(values);
      if (result.ok) {
        toast.success(module ? "Module updated" : "Module created");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="mod-title">
          Title
        </label>
        <Input id="mod-title" placeholder="Module title" {...register("title")} />
        {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="mod-description">
          Description
        </label>
        <Textarea
          id="mod-description"
          placeholder="Optional description"
          rows={3}
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="mod-week">
            Week
          </label>
          <Input
            id="mod-week"
            type="number"
            min={1}
            {...register("week_number", { valueAsNumber: true })}
          />
          {errors.week_number && (
            <p className="text-destructive text-xs">{errors.week_number.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="mod-order">
            Order
          </label>
          <Input
            id="mod-order"
            type="number"
            min={1}
            {...register("order", { valueAsNumber: true })}
          />
          {errors.order && <p className="text-destructive text-xs">{errors.order.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : module ? "Update module" : "Create module"}
      </Button>
    </Form>
  );
}
