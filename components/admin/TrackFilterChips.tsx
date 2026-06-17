"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const chips = [
  { label: "All", href: "/admin", value: "all" },
  { label: "Tech", href: "/admin?track=tech", value: "tech" },
  { label: "Non-tech", href: "/admin?track=non_tech", value: "non_tech" },
] as const;

export function TrackFilterChips() {
  const searchParams = useSearchParams();
  const current = searchParams.get("track") ?? "all";

  return (
    <div className="flex gap-2" role="group" aria-label="Filter by track">
      {chips.map(({ label, href, value }) => (
        <Link
          key={value}
          href={href}
          replace
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium transition-colors",
            current === value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
