import { FileText, Presentation, BookOpen, Play, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaterialType } from "@/lib/schemas/material";

const iconMap: Record<MaterialType, React.ElementType> = {
  doc: FileText,
  slides: Presentation,
  reading: BookOpen,
  video: Play,
  form: ClipboardList,
};

export function MaterialTypeIcon({ type, className }: { type: MaterialType; className?: string }) {
  const Icon = iconMap[type];
  return <Icon className={cn("h-5 w-5", className)} />;
}
