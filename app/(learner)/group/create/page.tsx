import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireLearner } from "@/lib/auth/session";
import { isGroupFormationOpen } from "@/lib/domain/cutoffs";
import { getGroupForUser } from "@/lib/db/groups";
import { getLearnersNotInAnyGroup } from "@/lib/db/groupMembers";
import { GroupEditForm } from "@/components/learner/GroupEditForm";

export default async function GroupCreatePage() {
  const user = await requireLearner();

  if (!isGroupFormationOpen()) redirect("/group");

  const existing = await getGroupForUser(user.id);
  if (existing) redirect("/group");

  const availableLearners = await getLearnersNotInAnyGroup(user.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <nav>
        <Link
          href="/group"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      </nav>

      <h1 className="text-2xl font-semibold">Create a group</h1>

      <GroupEditForm mode="create" availableLearners={availableLearners} />
    </div>
  );
}
