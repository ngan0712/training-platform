import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { SignInButton } from "./sign-in-button";

const ERROR_MESSAGES: Record<string, string> = {
  domain: "Only @pelago.co Google accounts are allowed.",
  auth: "Sign-in failed. Please try again.",
  no_code: "Sign-in failed. Please try again.",
};

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Sign-in failed.") : null;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Pelago Training</CardTitle>
          <CardDescription>Sign in with your @pelago.co Google account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {errorMessage && (
            <p className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">
              {errorMessage}
            </p>
          )}
          <SignInButton />
        </CardContent>
      </Card>
    </div>
  );
}
