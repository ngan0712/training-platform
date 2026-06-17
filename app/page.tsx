import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  redirect("/sign-in");
}
