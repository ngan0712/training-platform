import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminAllParticipants } from "@/lib/db/groups";
import { getAppSettings } from "@/lib/db/appSettings";
import { isGroupFormationOpen } from "@/lib/domain/cutoffs";
import { GroupAdminTable } from "@/components/admin/GroupAdminTable";
import { Badge } from "@/components/ui/badge";

export default async function AdminGroupsPage() {
  await requireAdmin();
  const [rows, settings, formationOpen] = await Promise.all([
    getAdminAllParticipants(),
    getAppSettings(),
    isGroupFormationOpen(),
  ]);

  const groupCount = rows.filter((r) => r.groupName !== "").length;
  const cutoffLabel = new Date(settings.group_submission_cutoff).toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Groups</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {groupCount} group{groupCount !== 1 ? "s" : ""} · {rows.length} total participant
          {rows.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="bg-card flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
        <Badge variant={formationOpen ? "default" : "secondary"}>
          {formationOpen ? "Formation open" : "Formation closed"}
        </Badge>
        <span className="text-muted-foreground">Deadline: {cutoffLabel}</span>
        <Link href="/admin/settings" className="text-primary ml-auto text-sm hover:underline">
          Change deadline
        </Link>
      </div>

      <GroupAdminTable rows={rows} />
    </div>
  );
}
