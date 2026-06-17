"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { GroupRow } from "@/lib/schemas/group";
import type { ActionResult } from "../actions";

type OpenGroup = GroupRow & { memberCount: number };

type Props = {
  groups: OpenGroup[];
  joinAction: (groupId: string) => Promise<ActionResult>;
};

export default function JoinGroupList({ groups, joinAction }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleJoin(groupId: string) {
    startTransition(async () => {
      const result = await joinAction(groupId);
      if (result.ok) {
        toast.success("You joined the group!");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <ul className="space-y-2">
      {groups.map((g) => (
        <li
          key={g.id}
          className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
        >
          <div className="min-w-0">
            <p className="font-medium">{g.name}</p>
            {g.project_idea && (
              <p className="text-muted-foreground mt-0.5 truncate text-sm">{g.project_idea}</p>
            )}
            <p className="text-muted-foreground mt-0.5 text-xs">{g.memberCount} / 5 members</p>
          </div>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => handleJoin(g.id)}>
            Join
          </Button>
        </li>
      ))}
    </ul>
  );
}
