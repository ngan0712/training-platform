import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireLearner } from "@/lib/auth/session";
import { isGroupFormationOpen } from "@/lib/domain/cutoffs";
import { getGroupForUser } from "@/lib/db/groups";
import { getLearnersNotInAnyGroup } from "@/lib/db/groupMembers";
import { GroupEditForm } from "@/components/learner/GroupEditForm";

export default async function GroupEditPage() {
  const user = await requireLearner();

  if (!(await isGroupFormationOpen())) redirect("/group");

  const groupWithMembers = await getGroupForUser(user.id);
  if (!groupWithMembers) redirect("/group");

  const { group, members } = groupWithMembers;
  const pic = members.find((m) => m.isPic);
  const isPic = pic?.userId === user.id;

  // Only fetch available learners for the PIC (used in member management).
  const availableLearners = isPic ? await getLearnersNotInAnyGroup(user.id) : [];

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

      <h1 className="text-2xl font-semibold">Edit group</h1>

      <GroupEditForm
        mode="edit"
        groupId={group.id}
        defaultValues={{
          name: group.name,
          project_idea: group.project_idea,
          pic_user_id: pic?.userId ?? members[0]?.userId ?? "",
        }}
        members={members}
        isPic={isPic}
        availableLearners={availableLearners}
      />
    </div>
  );
}
