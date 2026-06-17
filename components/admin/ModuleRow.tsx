import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ClipboardList, GraduationCap } from "lucide-react";
import type { ModuleRow as ModuleRowType } from "@/lib/schemas/module";
import type { MaterialRow } from "@/lib/schemas/material";

type Props = {
  module: ModuleRowType;
  materials: MaterialRow[];
  onEdit: () => void;
  onDelete: () => void;
  weekCell?: React.ReactNode;
};

export function ModuleRow({ module, materials, onEdit, onDelete, weekCell }: Props) {
  const compulsoryCount = materials.filter((m) => m.is_compulsory).length;
  const optionalCount = materials.filter((m) => !m.is_compulsory).length;

  return (
    <tr className="hover:bg-muted/30 border-b">
      {weekCell}
      <td className="px-3 py-2">
        <Link
          href={`/admin/modules/${module.id}/materials`}
          className="text-foreground text-sm font-medium hover:underline"
        >
          {module.title}
        </Link>
        {module.description && (
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{module.description}</p>
        )}
      </td>
      <td className="text-muted-foreground px-3 py-2 text-xs">
        {compulsoryCount} compulsory · {optionalCount} optional
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <Link
            href={`/admin/modules/${module.id}/exercises`}
            aria-label="Exercises"
            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] transition-colors"
          >
            <ClipboardList className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/admin/modules/${module.id}/quiz`}
            aria-label="Quiz"
            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] transition-colors"
          >
            <GraduationCap className="h-3.5 w-3.5" />
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
