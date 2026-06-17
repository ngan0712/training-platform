import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { ReorderButtons } from "./ReorderButtons";
import { MaterialTypeIcon } from "@/components/learner/MaterialTypeIcon";
import type { MaterialRow } from "@/lib/schemas/material";

type Props = {
  material: MaterialRow;
  isFirst: boolean;
  isLast: boolean;
  reorderPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function MaterialAdminRow({
  material,
  isFirst,
  isLast,
  reorderPending,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  return (
    <tr className="hover:bg-muted/30 border-b">
      <td className="px-3 py-2">
        <ReorderButtons
          isFirst={isFirst}
          isLast={isLast}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          disabled={reorderPending}
        />
      </td>
      <td className="px-3 py-2">
        <MaterialTypeIcon type={material.type} className="text-muted-foreground h-4 w-4" />
      </td>
      <td className="px-3 py-2">
        <a
          href={material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          {material.title}
          <ExternalLink className="text-muted-foreground h-3 w-3" />
        </a>
      </td>
      <td className="px-3 py-2">
        <Badge variant={material.is_compulsory ? "default" : "secondary"}>
          {material.is_compulsory ? "Compulsory" : "Optional"}
        </Badge>
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
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
