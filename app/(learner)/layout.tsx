import { redirect } from "next/navigation";
import { requireLearner } from "@/lib/auth/session";
import { SidebarShell } from "@/components/shared/SidebarShell";

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireLearner();
  if (!user.name) redirect("/onboarding");

  return <SidebarShell user={user}>{children}</SidebarShell>;
}
