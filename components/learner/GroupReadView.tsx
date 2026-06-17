"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, LogOut, Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { leaveGroup } from "@/app/(learner)/group/actions";
import type { GroupWithMembers } from "@/lib/db/groups";

type Props = {
  groupWithMembers: GroupWithMembers;
  currentUserId: string;
  isFormationOpen: boolean;
};

export function GroupReadView({ groupWithMembers, currentUserId, isFormationOpen }: Props) {
  const { group, members } = groupWithMembers;
  const router = useRouter();
  const [leavePending, startLeave] = useTransition();

  const currentMember = members.find((m) => m.userId === currentUserId);
  const isCurrentUserPic = currentMember?.isPic ?? false;

  function handleLeave() {
    startLeave(async () => {
      const result = await leaveGroup(group.id);
      if (result.ok) {
        toast.success("You have left the group");
        router.push("/group");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {!isFormationOpen && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Group formation is closed. This view is read-only.
        </div>
      )}

      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{group.name}</h2>
        {group.project_idea && (
          <p className="text-muted-foreground text-sm">{group.project_idea}</p>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Members ({members.length})</h3>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 rounded-md border px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{m.name || m.email}</p>
                {m.name && <p className="text-muted-foreground truncate text-xs">{m.email}</p>}
              </div>
              {m.isPic && (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <Star className="h-3 w-3" />
                  PIC
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isFormationOpen && (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/group/edit"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit group
          </Link>

          {!isCurrentUserPic && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={leavePending}
              onClick={handleLeave}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {leavePending ? "Leaving…" : "Leave group"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
