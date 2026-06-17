"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton() {
  return (
    <a href="/api/admin/export-completion" download="completion.csv">
      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </a>
  );
}
