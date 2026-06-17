"use server";

import { redirect } from "next/navigation";
import { requireLearner } from "@/lib/auth/session";
import { updateUserProfile } from "@/lib/db/users";
import { OnboardingSchema, type OnboardingInput } from "@/lib/schemas/onboarding";

export async function completeOnboarding(data: OnboardingInput): Promise<void> {
  const user = await requireLearner();
  const parsed = OnboardingSchema.parse(data);
  await updateUserProfile(user.id, parsed);
  redirect("/dashboard");
}
