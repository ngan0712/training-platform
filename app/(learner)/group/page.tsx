import Link from "next/link";
import { Plus, User, Users } from "lucide-react";
import { requireLearner } from "@/lib/auth/session";
import { isGroupFormationOpen } from "@/lib/domain/cutoffs";
import { getGroupForUser } from "@/lib/db/groups";
import { getGroupsWithMemberNames } from "@/lib/db/groups";
import { getParticipationModeField } from "@/lib/db/participationMode";
import { GroupReadView } from "@/components/learner/GroupReadView";
import { GroupSearchBar } from "@/components/learner/GroupSearchBar";
import { SoloChoiceButton } from "./_components/SoloChoiceButton";
import { SwitchToSoloButton } from "./_components/SwitchToSoloButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function GroupPage() {
  const user = await requireLearner();
  const formationOpen = await isGroupFormationOpen();

  const [groupWithMembers, participationModeField, openGroups] = await Promise.all([
    getGroupForUser(user.id),
    getParticipationModeField(user.id),
    formationOpen ? getGroupsWithMemberNames(user.id) : Promise.resolve([]),
  ]);

  const participationMode = groupWithMembers ? "group" : participationModeField;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Capstone</h1>

      {groupWithMembers ? (
        // In a group
        <div className="space-y-4">
          <GroupReadView
            groupWithMembers={groupWithMembers}
            currentUserId={user.id}
            isFormationOpen={formationOpen}
          />
          {formationOpen && <SwitchToSoloButton groupId={groupWithMembers.group.id} />}
        </div>
      ) : participationMode === "individual" ? (
        // Explicitly solo
        <IndividualView formationOpen={formationOpen} openGroups={openGroups} />
      ) : formationOpen ? (
        // Undecided — show mode choice
        <UndecidedView openGroups={openGroups} />
      ) : (
        // Past cutoff, undecided → read-only individual
        <ClosedView />
      )}
    </div>
  );
}

function UndecidedView({
  openGroups,
}: {
  openGroups: Awaited<ReturnType<typeof getGroupsWithMemberNames>>;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border p-6">
        <Users className="text-muted-foreground/50 mx-auto mb-3 h-10 w-10" />
        <p className="text-center font-medium">How would you like to do the capstone?</p>
        <p className="text-muted-foreground mt-1 text-center text-sm">
          Choose before the Week 5 deadline. You can change your mind any time before then.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SoloChoiceButton />
          <Link
            href="/group/create"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            <Plus className="h-4 w-4" />
            Create a group
          </Link>
        </div>
      </div>

      {openGroups.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            Or join an existing group
          </h2>
          <GroupSearchBar groups={openGroups} />
        </div>
      )}
    </div>
  );
}

function IndividualView({
  formationOpen,
  openGroups,
}: {
  formationOpen: boolean;
  openGroups: Awaited<ReturnType<typeof getGroupsWithMemberNames>>;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border p-6">
        <User className="text-muted-foreground/50 mx-auto mb-3 h-10 w-10" />
        <p className="text-center font-medium">You&apos;re going solo</p>
        <p className="text-muted-foreground mt-1 text-center text-sm">
          You&apos;ve chosen to complete the capstone as an individual participant.
        </p>
        {formationOpen && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/group/create"
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              <Plus className="h-4 w-4" />
              Create a group instead
            </Link>
          </div>
        )}
      </div>

      {formationOpen && openGroups.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            Or join an existing group
          </h2>
          <GroupSearchBar groups={openGroups} />
        </div>
      )}
    </div>
  );
}

function ClosedView() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-6 text-center">
      <p className="text-sm font-medium text-amber-800">Group formation is closed.</p>
      <p className="mt-1 text-sm text-amber-700">
        The deadline to create or join a group has passed. You are participating as an individual.
      </p>
    </div>
  );
}
