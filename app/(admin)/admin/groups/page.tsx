import { requireAdmin } from "@/lib/auth/session";
import { getAdminAllParticipants } from "@/lib/db/groups";
import { GroupAdminTable } from "@/components/admin/GroupAdminTable";

export default async function AdminGroupsPage() {
  await requireAdmin();
  const rows = await getAdminAllParticipants();

  const groupCount = rows.filter((r) => r.groupName !== "").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Groups</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {groupCount} group{groupCount !== 1 ? "s" : ""} · {rows.length} total participant
          {rows.length !== 1 ? "s" : ""}
        </p>
      </div>
      <GroupAdminTable rows={rows} />
    </div>
  );
}
