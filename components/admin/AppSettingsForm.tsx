"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UpdateAppSettingsSchema, type UpdateAppSettingsInput } from "@/lib/schemas/appSettings";
import { updateAppSettings } from "@/app/(admin)/admin/settings/actions";

type Props = {
  groupSubmissionCutoff: string;
};

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in the browser's local time zone.
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppSettingsForm({ groupSubmissionCutoff }: Props) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateAppSettingsInput>({
    resolver: zodResolver(UpdateAppSettingsSchema),
  });

  function onSubmit(values: UpdateAppSettingsInput) {
    startTransition(async () => {
      const result = await updateAppSettings(values);
      if (result.ok) {
        toast.success("Group formation deadline updated");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="max-w-sm">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="group-cutoff">
          Group formation deadline
        </label>
        <Input
          id="group-cutoff"
          type="datetime-local"
          defaultValue={toDatetimeLocal(groupSubmissionCutoff)}
          {...register("group_submission_cutoff")}
        />
        {errors.group_submission_cutoff && (
          <p className="text-destructive text-xs">{errors.group_submission_cutoff.message}</p>
        )}
        <p className="text-muted-foreground text-xs">
          Learners can create, join, or edit groups until this time. Extend it to reopen group
          formation.
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </Form>
  );
}
