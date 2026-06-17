"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ModuleRow } from "./ModuleRow";
import { ModuleForm } from "./ModuleForm";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { deleteModule, reorderWeeks } from "@/app/(admin)/admin/modules/actions";
import { ReorderButtons } from "./ReorderButtons";
import type { ModuleRow as ModuleRowType } from "@/lib/schemas/module";
import type { MaterialRow } from "@/lib/schemas/material";

type Props = {
  modules: ModuleRowType[];
  materials: MaterialRow[];
};

type FormDialog = { open: false } | { open: true; module?: ModuleRowType };
type DeleteDialog = { open: false } | { open: true; id: string; title: string };

export function ModuleListTable({ modules, materials }: Props) {
  const [formDialog, setFormDialog] = useState<FormDialog>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog>({ open: false });
  const [weekReorderPending, startWeekReorder] = useTransition();

  const sortedModules = [...modules].sort((a, b) =>
    a.week_number !== b.week_number ? a.week_number - b.week_number : a.order - b.order
  );

  const sortedWeeks = [...new Set(sortedModules.map((m) => m.week_number))];

  function handleWeekMoveUp(weekNumber: number) {
    const idx = sortedWeeks.indexOf(weekNumber);
    if (idx <= 0) return;
    const prev = sortedWeeks[idx - 1];
    startWeekReorder(async () => {
      const result = await reorderWeeks(weekNumber, prev);
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleWeekMoveDown(weekNumber: number) {
    const idx = sortedWeeks.indexOf(weekNumber);
    if (idx < 0 || idx >= sortedWeeks.length - 1) return;
    const next = sortedWeeks[idx + 1];
    startWeekReorder(async () => {
      const result = await reorderWeeks(weekNumber, next);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setFormDialog({ open: true })}>
          <Plus className="mr-2 h-4 w-4" />
          New module
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-card border-b">
              <th className="px-3 py-2 text-left font-medium">Week</th>
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 text-left font-medium">Materials</th>
              <th className="px-3 py-2 text-left font-medium">Track</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {sortedModules.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                  No modules yet. Click &ldquo;New module&rdquo; to add one.
                </td>
              </tr>
            ) : (
              sortedWeeks.flatMap((weekNumber, weekIdx) => {
                const siblings = sortedModules.filter((m) => m.week_number === weekNumber);
                return siblings.map((mod, sibIdx) => (
                  <ModuleRow
                    key={mod.id}
                    module={mod}
                    materials={materials.filter((m) => m.module_id === mod.id)}
                    onEdit={() => setFormDialog({ open: true, module: mod })}
                    onDelete={() => setDeleteDialog({ open: true, id: mod.id, title: mod.title })}
                    weekCell={
                      sibIdx === 0 ? (
                        <td rowSpan={siblings.length} className="border-r px-3 py-2 align-middle">
                          <div className="flex items-center gap-1.5">
                            <ReorderButtons
                              isFirst={weekIdx === 0}
                              isLast={weekIdx === sortedWeeks.length - 1}
                              disabled={weekReorderPending}
                              onMoveUp={() => handleWeekMoveUp(weekNumber)}
                              onMoveDown={() => handleWeekMoveDown(weekNumber)}
                            />
                            <span className="text-sm font-medium whitespace-nowrap">
                              Week {weekNumber}
                            </span>
                          </div>
                        </td>
                      ) : undefined
                    }
                  />
                ));
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit dialog */}
      <Dialog
        open={formDialog.open}
        onOpenChange={(open) => !open && setFormDialog({ open: false })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formDialog.open && formDialog.module ? "Edit module" : "New module"}
            </DialogTitle>
          </DialogHeader>
          {formDialog.open && (
            <ModuleForm
              module={formDialog.module}
              onSuccess={() => setFormDialog({ open: false })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false })}
        entityName={deleteDialog.open ? deleteDialog.title : ""}
        onConfirm={async () => {
          if (!deleteDialog.open) return;
          const result = await deleteModule(deleteDialog.id);
          if (result.ok) {
            toast.success("Module deleted");
          } else {
            toast.error(result.error);
          }
        }}
      />
    </div>
  );
}
