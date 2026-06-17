import { requireAdmin } from "@/lib/auth/session";
import { SidebarShell } from "@/components/shared/SidebarShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <SidebarShell user={user}>{children}</SidebarShell>;
}
