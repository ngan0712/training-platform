import Link from "next/link";
import { Users, User, ArrowRight, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GroupWithMembers } from "@/lib/db/groups";
import type { ParticipationMode } from "@/lib/schemas/user";

type Props = {
  groupWithMembers: GroupWithMembers | null;
  participationMode: ParticipationMode;
  isFormationOpen: boolean;
};

export function GroupCard({ groupWithMembers, participationMode, isFormationOpen }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Capstone
        </CardTitle>
      </CardHeader>
      <CardContent>
        {groupWithMembers ? (
          <GroupView groupWithMembers={groupWithMembers} />
        ) : participationMode === "individual" ? (
          <IndividualView isFormationOpen={isFormationOpen} />
        ) : isFormationOpen ? (
          <UndecidedView />
        ) : (
          <p className="text-muted-foreground text-sm">Group formation is closed.</p>
        )}
      </CardContent>
    </Card>
  );
}

function GroupView({ groupWithMembers }: { groupWithMembers: GroupWithMembers }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium">{groupWithMembers.group.name}</p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {groupWithMembers.members.length} member
          {groupWithMembers.members.length !== 1 ? "s" : ""}
        </p>
      </div>
      {groupWithMembers.group.project_idea && (
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {groupWithMembers.group.project_idea}
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        {groupWithMembers.members.slice(0, 3).map((m) => (
          <Badge key={m.userId} variant="outline" className="text-xs">
            {m.name || m.email.split("@")[0]}
          </Badge>
        ))}
        {groupWithMembers.members.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{groupWithMembers.members.length - 3} more
          </Badge>
        )}
      </div>
      <Link
        href="/group"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center")}
      >
        View group
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
}

function IndividualView({ isFormationOpen }: { isFormationOpen: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <User className="text-muted-foreground h-4 w-4" />
        <span className="font-medium">Going solo</span>
      </div>
      <p className="text-muted-foreground text-sm">
        You&apos;re doing the capstone as an individual participant.
      </p>
      {isFormationOpen && (
        <Link
          href="/group"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full justify-center"
          )}
        >
          Change format
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function UndecidedView() {
  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <HelpCircle className="h-4 w-4" />
        <span>Not decided yet</span>
      </div>
      <p className="text-muted-foreground text-sm">
        Choose to go solo or form a group before the Week 5 deadline.
      </p>
      <Link href="/group" className={cn(buttonVariants({ size: "sm" }), "w-full justify-center")}>
        Choose format
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
}
