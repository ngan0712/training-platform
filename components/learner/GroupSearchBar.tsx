"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { joinGroup } from "@/app/(learner)/group/actions";
import type { GroupSearchItem } from "@/lib/db/groups";

type Props = {
  groups: GroupSearchItem[];
};

export function GroupSearchBar({ groups }: Props) {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const q = query.trim().toLowerCase();
  const filtered =
    q === ""
      ? groups
      : groups.filter(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.memberNames.some((n) => n.toLowerCase().includes(q))
        );

  function handleJoin(groupId: string) {
    startTransition(async () => {
      const result = await joinGroup(groupId);
      if (result.ok) {
        toast.success("You joined the group!");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          placeholder="Search by group name or member name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {groups.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No groups have been formed yet.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No groups match &quot;{query}&quot;
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">{g.name}</p>
                {g.project_idea && (
                  <p className="text-muted-foreground mt-0.5 truncate text-sm">{g.project_idea}</p>
                )}
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {g.memberCount} / 5 members
                  {g.memberNames.length > 0 && <> · {g.memberNames.filter(Boolean).join(", ")}</>}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => handleJoin(g.id)}
              >
                Join
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
