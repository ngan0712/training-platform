"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  CreateMaterialSchema,
  type CreateMaterialInput,
  type MaterialRow,
} from "@/lib/schemas/material";
import { createMaterial, updateMaterial } from "@/app/(admin)/admin/modules/[id]/materials/actions";

type Props = {
  moduleId: string;
  material?: MaterialRow;
  nextOrder: number;
  onSuccess: () => void;
};

export function MaterialForm({ moduleId, material, nextOrder, onSuccess }: Props) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMaterialInput>({
    resolver: zodResolver(CreateMaterialSchema),
    defaultValues: material
      ? {
          module_id: material.module_id,
          title: material.title,
          url: material.url,
          type: material.type,
          is_compulsory: material.is_compulsory,
          order: material.order,
        }
      : {
          module_id: moduleId,
          is_compulsory: true,
          order: nextOrder,
        },
  });

  function onSubmit(values: CreateMaterialInput) {
    startTransition(async () => {
      const result = material
        ? await updateMaterial(material.id, moduleId, values)
        : await createMaterial(values);
      if (result.ok) {
        toast.success(material ? "Material updated" : "Material added");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register("module_id")} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="mat-title">
          Title
        </label>
        <Input id="mat-title" placeholder="Material title" {...register("title")} />
        {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="mat-url">
          URL
        </label>
        <Input id="mat-url" type="url" placeholder="https://…" {...register("url")} />
        {errors.url && <p className="text-destructive text-xs">{errors.url.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Type</label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doc">Document</SelectItem>
                  <SelectItem value="slides">Slides</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-destructive text-xs">{errors.type.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="mat-order">
            Order
          </label>
          <Input
            id="mat-order"
            type="number"
            min={1}
            {...register("order", { valueAsNumber: true })}
          />
          {errors.order && <p className="text-destructive text-xs">{errors.order.message}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <p className="text-sm font-medium">Compulsory</p>
          <p className="text-muted-foreground text-xs">Gates next module unlock</p>
        </div>
        <Controller
          control={control}
          name="is_compulsory"
          render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : material ? "Update material" : "Add material"}
      </Button>
    </Form>
  );
}
