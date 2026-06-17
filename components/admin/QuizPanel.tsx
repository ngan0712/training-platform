"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { QuizForm } from "@/components/admin/QuizForm";
import { deleteQuiz } from "@/app/(admin)/admin/modules/[id]/quiz/actions";
import type { QuizWithQuestionsAdmin } from "@/lib/schemas/quiz";

type Props = {
  moduleId: string;
  quiz: QuizWithQuestionsAdmin | null;
};

export function QuizPanel({ moduleId, quiz }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDeleteConfirm() {
    if (!quiz) return;
    setDeleteOpen(false);
    const result = await deleteQuiz(quiz.id, moduleId);
    if (result.ok) {
      toast.success("Quiz deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  if (!quiz) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">No quiz attached to this module yet.</p>
        <Button size="sm" onClick={() => setEditOpen(true)}>
          <GraduationCap className="mr-1 h-4 w-4" />
          Create quiz
        </Button>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create quiz</DialogTitle>
            </DialogHeader>
            <QuizForm
              moduleId={moduleId}
              onSuccess={() => {
                setEditOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="divide-y rounded-lg border text-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{quiz.title}</p>
              {quiz.is_compulsory ? (
                <Badge variant="default">Compulsory</Badge>
              ) : (
                <Badge variant="secondary">Optional</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""} · Pass at{" "}
              {quiz.pass_threshold}%
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit quiz</DialogTitle>
          </DialogHeader>
          <QuizForm
            moduleId={moduleId}
            quiz={quiz}
            onSuccess={() => {
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        entityName={quiz.title}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
