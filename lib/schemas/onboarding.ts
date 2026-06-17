import { z } from "zod";

export const OnboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;
