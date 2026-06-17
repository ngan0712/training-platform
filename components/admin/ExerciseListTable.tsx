"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { ExerciseForm } from "@/components/admin/ExerciseForm";
import { ReorderButtons } from "@/components/admin/ReorderButtons";
import { Badge } from "@/components/ui/badge";
import type { ExerciseRow } from "@/lib/schemas/exercise";

import type { ExerciseQuestionRow } from "@/lib/schemas/exerciseQuestion";
import {
  deleteExercise,
  reorderExercises,
} from "@/app/(admin)/admin/modules/[id]/exercises/actions";

type Props = {
  moduleId: string;
  exercises: ExerciseRow[];
  questionsByExercise: Record<string, ExerciseQuestionRow[]>;
  nextOrder: number;
};

export function ExerciseListTable({ moduleId, exercises, questionsByExercise, nextOrder }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<ExerciseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExerciseRow | null>(null);
  const [reorderPending, startReorder] = useTransition();

  const sorted = [...exercises].sort((a, b) => a.order - b.order);

  function handleMoveUp(ex: ExerciseRow) {
    const idx = sorted.findIndex((e) => e.id === ex.id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1];
    startReorder(async () => {
      const result = await reorderExercises(moduleId, ex.order, prev.order);
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleMoveDown(ex: ExerciseRow) {
    const idx = sorted.findIndex((e) => e.id === ex.id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const next = sorted[idx + 1];
    startReorder(async () => {
      const result = await reorderExercises(moduleId, ex.order, next.order);
      if (!result.ok) toast.error(result.error);
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    const result = await deleteExercise(id, moduleId);
    if (result.ok) {
      toast.success("Exercise deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New exercise
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No exercises yet. Add the first one.
        </p>
      ) : (
        <div className="divide-y rounded-lg border text-sm">
          {sorted.map((ex, idx) => (
            <div key={ex.id} className="flex items-center gap-3 px-4 py-3">
              <ReorderButtons
                isFirst={idx === 0}
                isLast={idx === sorted.length - 1}
                disabled={reorderPending}
                onMoveUp={() => handleMoveUp(ex)}
                onMoveDown={() => handleMoveDown(ex)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{ex.title}</p>
                  {ex.is_compulsory ? (
                    <Badge variant="default">Compulsory</Badge>
                  ) : (
                    <Badge variant="secondary">Optional</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {(questionsByExercise[ex.id] ?? []).length} question
                  {(questionsByExercise[ex.id] ?? []).length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditExercise(ex)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(ex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New exercise</DialogTitle>
          </DialogHeader>
          <ExerciseForm
            moduleId={moduleId}
            nextOrder={nextOrder}
            onSuccess={() => {
              setCreateOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editExercise} onOpenChange={(open) => !open && setEditExercise(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit exercise</DialogTitle>
          </DialogHeader>
          {editExercise && (
            <ExerciseForm
              moduleId={moduleId}
              exercise={editExercise}
              existingQuestions={questionsByExercise[editExercise.id] ?? []}
              nextOrder={nextOrder}
              onSuccess={() => {
                setEditExercise(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        entityName={deleteTarget?.title ?? "this exercise"}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
