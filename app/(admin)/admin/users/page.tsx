import { requireAdmin } from "@/lib/auth/session";
import { getAllUsersWithActivity } from "@/lib/db/users";
import { UserManagementTable } from "@/components/admin/UserManagementTable";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const users = await getAllUsersWithActivity();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm">{users.length} registered</p>
      </div>
      <UserManagementTable users={users} currentUserId={session.id} />
    </div>
  );
}
