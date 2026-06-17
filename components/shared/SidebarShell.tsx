"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "./PageHeader";
import { SidebarNav } from "./SidebarNav";
import { ProfileMenu } from "./ProfileMenu";

type Props = {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
};

export function SidebarShell({ user, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full min-h-screen">
      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center border-b px-5">
          <span className="text-sm font-semibold">Pelago Training</span>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav isAdmin={user.role === "admin"} />
        </div>
        <div className="shrink-0 border-t p-2">
          <ProfileMenu name={user.name} email={user.email} />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader onMenuToggle={() => setOpen((v) => !v)} isOpen={open} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
