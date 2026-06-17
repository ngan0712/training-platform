"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, ShieldCheck, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { UserWithActivity } from "@/lib/db/users";

type Props = {
  users: UserWithActivity[];
  currentUserId: string;
};

type PromoteDialog = { open: false } | { open: true; user: UserWithActivity };
type ClearDialog = { open: false } | { open: true; user: UserWithActivity; emailInput: string };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function UserManagementTable({ users, currentUserId }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [promoteDialog, setPromoteDialog] = useState<PromoteDialog>({ open: false });
  const [clearDialog, setClearDialog] = useState<ClearDialog>({ open: false });
  const [promotePending, startPromoteTransition] = useTransition();
  const [clearPending, startClearTransition] = useTransition();

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  function handlePromoteConfirm() {
    if (!promoteDialog.open) return;
    const { user } = promoteDialog;
    startPromoteTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${user.id}/promote`, { method: "PATCH" });
        if (!res.ok) throw new Error(await res.text());
        toast.success(`${user.name} promoted to admin`);
        setPromoteDialog({ open: false });
        router.refresh();
      } catch {
        toast.error("Failed to promote user");
      }
    });
  }

  function handleClearConfirm() {
    if (!clearDialog.open) return;
    const { user } = clearDialog;
    startClearTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${user.id}/history`, { method: "DELETE" });
        if (!res.ok) throw new Error(await res.text());
        toast.success(`History cleared for ${user.name}`);
        setClearDialog({ open: false });
        router.refresh();
      } catch {
        toast.error("Failed to clear history");
      }
    });
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-card border-b">
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Role</th>
              <th className="px-3 py-2 text-left font-medium">Last activity</th>
              <th className="px-3 py-2 text-left font-medium">Joined</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                  {search ? "No users match your search." : "No users yet."}
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{user.name || "—"}</td>
                  <td className="text-muted-foreground px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground px-3 py-2">
                    {formatDate(user.last_activity)}
                  </td>
                  <td className="text-muted-foreground px-3 py-2">{formatDate(user.created_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Progress
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" className="h-7 w-7" />}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end">
                          <DropdownMenuItem
                            disabled={user.role === "admin"}
                            onClick={() => setPromoteDialog({ open: true, user })}
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Promote to admin
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            variant="destructive"
                            disabled={user.id === currentUserId}
                            onClick={() => setClearDialog({ open: true, user, emailInput: "" })}
                          >
                            <Trash2 className="h-4 w-4" />
                            Clear history
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Promote to admin dialog */}
      <Dialog
        open={promoteDialog.open}
        onOpenChange={(open) => !open && setPromoteDialog({ open: false })}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Promote to admin?</DialogTitle>
            <DialogDescription>
              {promoteDialog.open && (
                <>
                  This cannot be undone from the admin panel.{" "}
                  <strong>{promoteDialog.user.name}</strong> will gain full admin access immediately
                  after their next sign-in.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={promotePending} />}>
              Cancel
            </DialogClose>
            <Button onClick={handlePromoteConfirm} disabled={promotePending}>
              {promotePending ? "Promoting…" : "Promote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear history dialog */}
      <Dialog
        open={clearDialog.open}
        onOpenChange={(open) => !open && setClearDialog({ open: false })}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Clear history?</DialogTitle>
            <DialogDescription>
              This will permanently delete all learning records for{" "}
              <strong>{clearDialog.open ? clearDialog.user.name : ""}</strong>. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <ul className="text-muted-foreground list-disc space-y-1 pl-5">
              <li>Material clicks</li>
              <li>Exercise submissions and answers</li>
              <li>Quiz attempts</li>
            </ul>
            <div className="space-y-1.5">
              <p className="text-muted-foreground">
                Type{" "}
                <strong className="text-foreground">
                  {clearDialog.open ? clearDialog.user.email : ""}
                </strong>{" "}
                to confirm:
              </p>
              <Input
                value={clearDialog.open ? clearDialog.emailInput : ""}
                onChange={(e) =>
                  clearDialog.open && setClearDialog({ ...clearDialog, emailInput: e.target.value })
                }
                placeholder="user@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={clearPending} />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              disabled={
                clearPending ||
                !clearDialog.open ||
                clearDialog.emailInput !== clearDialog.user.email
              }
              onClick={handleClearConfirm}
            >
              {clearPending ? "Clearing…" : "Clear history"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
