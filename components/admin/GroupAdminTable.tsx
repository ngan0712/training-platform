"use client";

import { Activity } from "lucide-react";
import type { AdminParticipantRow } from "@/lib/db/groups";

type Props = {
  rows: AdminParticipantRow[];
};

export function GroupAdminTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border px-4 py-8 text-center text-sm">
        No participants yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-card border-b">
            <th className="px-4 py-2 text-left font-medium">Members</th>
            <th className="px-4 py-2 text-left font-medium">Size</th>
            <th className="px-4 py-2 text-left font-medium">Group name</th>
            <th className="px-4 py-2 text-left font-medium">Project idea</th>
            <th className="px-4 py-2 text-right font-medium">
              <span className="inline-flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" />
                7-day clicks
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rowKey} className="hover:bg-muted/40 border-b last:border-0">
              <td className="px-4 py-3">
                <div className="space-y-0.5">
                  {r.memberNames.filter(Boolean).map((name, i) => (
                    <p key={i} className="text-sm">
                      {name}
                    </p>
                  ))}
                </div>
              </td>
              <td className="text-muted-foreground px-4 py-3 tabular-nums">{r.size}</td>
              <td className="px-4 py-3">
                {r.groupName ? (
                  <span className="font-medium">{r.groupName}</span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </td>
              <td className="max-w-xs px-4 py-3">
                {r.project_idea ? (
                  <p className="text-muted-foreground line-clamp-2">{r.project_idea}</p>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{r.weeklyClicks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
