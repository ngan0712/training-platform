"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({
  onMenuToggle,
  isOpen,
}: {
  onMenuToggle: () => void;
  isOpen: boolean;
}) {
  return (
    <header className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      <span className="font-semibold">Pelago Training</span>
    </header>
  );
}
