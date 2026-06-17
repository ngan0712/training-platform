"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ShieldCheck,
  BarChart2,
  UsersRound,
  ClipboardList,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const learnerLinks: {
  href: "/dashboard" | "/modules" | "/group";
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/modules", label: "Modules", icon: BookOpen },
  { href: "/group", label: "My Group", icon: Users },
];

export function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-2">
      {learnerLinks.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === href || pathname.startsWith(href + "/")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}

      {isAdmin && (
        <>
          <div className="my-2 border-t" />
          {(
            [
              { href: "/admin", label: "Progress", icon: BarChart2, exact: true },
              { href: "/admin/users", label: "Users", icon: UserCog, exact: false },
              { href: "/admin/modules", label: "Curriculum", icon: ShieldCheck, exact: false },
              { href: "/admin/groups", label: "Groups", icon: UsersRound, exact: false },
              { href: "/admin/exercises", label: "Exercises", icon: ClipboardList, exact: false },
            ] as const
          ).map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                exact
                  ? pathname === href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  : pathname.startsWith(href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}
