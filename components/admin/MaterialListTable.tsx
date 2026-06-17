"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MaterialAdminRow } from "./MaterialAdminRow";
import { MaterialForm } from "./MaterialForm";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import {
  deleteMaterial,
  reorderMaterials,
} from "@/app/(admin)/admin/modules/[id]/materials/actions";
import type { MaterialRow } from "@/lib/schemas/material";

type Props = {
  moduleId: string;
  materials: MaterialRow[];
};

type FormDialog = { open: false } | { open: true; material?: MaterialRow };
type DeleteDialog = { open: false } | { open: true; id: string; title: string };

export function MaterialListTable({ moduleId, materials }: Props) {
  const [formDialog, setFormDialog] = useState<FormDialog>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog>({ open: false });
  const [reorderPending, startReorder] = useTransition();

  const sorted = [...materials].sort((a, b) => a.order - b.order);

  function handleMoveUp(mat: MaterialRow) {
    const idx = sorted.findIndex((m) => m.id === mat.id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1];
    startReorder(async () => {
      const result = await reorderMaterials(moduleId, mat.order, prev.order);
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleMoveDown(mat: MaterialRow) {
    const idx = sorted.findIndex((m) => m.id === mat.id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const next = sorted[idx + 1];
    startReorder(async () => {
      const result = await reorderMaterials(moduleId, mat.order, next.order);
      if (!result.ok) toast.error(result.error);
    });
  }

  const nextOrder = sorted.length > 0 ? Math.max(...sorted.map((m) => m.order)) + 1 : 1;

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Link
          href={`/admin/modules/${moduleId}/exercises`}
          className="border-input bg-background hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] border px-3 text-sm font-medium transition-colors"
        >
          <ClipboardList className="h-4 w-4" />
          Add exercise
        </Link>
        <Button size="sm" onClick={() => setFormDialog({ open: true })}>
          <Plus className="mr-2 h-4 w-4" />
          Add material
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-card border-b">
              <th className="w-8 px-3 py-2" />
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                  No materials yet. Click &ldquo;Add material&rdquo; to add one.
                </td>
              </tr>
            ) : (
              sorted.map((mat, idx) => (
                <MaterialAdminRow
                  key={mat.id}
                  material={mat}
                  isFirst={idx === 0}
                  isLast={idx === sorted.length - 1}
                  reorderPending={reorderPending}
                  onEdit={() => setFormDialog({ open: true, material: mat })}
                  onDelete={() => setDeleteDialog({ open: true, id: mat.id, title: mat.title })}
                  onMoveUp={() => handleMoveUp(mat)}
                  onMoveDown={() => handleMoveDown(mat)}
                />
              ))
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
              {formDialog.open && formDialog.material ? "Edit material" : "Add material"}
            </DialogTitle>
          </DialogHeader>
          {formDialog.open && (
            <MaterialForm
              moduleId={moduleId}
              material={formDialog.material}
              nextOrder={nextOrder}
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
          const result = await deleteMaterial(deleteDialog.id, moduleId);
          if (result.ok) {
            toast.success("Material deleted");
          } else {
            toast.error(result.error);
          }
        }}
      />
    </div>
  );
}
