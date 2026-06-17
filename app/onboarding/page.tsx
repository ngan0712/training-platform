import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { requireLearner } from "@/lib/auth/session";
import { OnboardingForm } from "./_components/OnboardingForm";

export default async function OnboardingPage() {
  const user = await requireLearner();
  if (user.name) redirect("/dashboard");

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Pelago Training</CardTitle>
          <CardDescription>Confirm your name to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm defaultName={user.name} />
        </CardContent>
      </Card>
    </div>
  );
}
