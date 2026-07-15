import { requireAdmin } from "@/lib/auth/session";
import { getAppSettings } from "@/lib/db/appSettings";
import { AppSettingsForm } from "@/components/admin/AppSettingsForm";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const settings = await getAppSettings();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Platform-wide controls.</p>
      </div>
      <AppSettingsForm
        key={settings.group_submission_cutoff}
        groupSubmissionCutoff={settings.group_submission_cutoff}
      />
    </div>
  );
}
