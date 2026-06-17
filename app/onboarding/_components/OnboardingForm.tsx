"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OnboardingSchema, type OnboardingInput } from "@/lib/schemas/onboarding";
import { completeOnboarding } from "../actions";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: { name: defaultName },
  });

  function onSubmit(values: OnboardingInput) {
    startTransition(async () => {
      await completeOnboarding(values);
    });
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="name">
          Your name
        </label>
        <Input id="name" placeholder="Full name" {...register("name")} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Get started"}
      </Button>
    </Form>
  );
}
