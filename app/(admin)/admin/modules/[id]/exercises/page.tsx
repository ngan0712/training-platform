import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getModuleById } from "@/lib/db/modules";
import { getExercisesByModule, adminGetQuestionsForExercise } from "@/lib/db/exercises";
import { Badge } from "@/components/ui/badge";
import { ExerciseListTable } from "@/components/admin/ExerciseListTable";
import type { ExerciseQuestionRow } from "@/lib/schemas/exerciseQuestion";

type Props = { params: Promise<{ id: string }> };

export default async function AdminExercisesPage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const [mod, exercises] = await Promise.all([getModuleById(id), getExercisesByModule(id)]);

  if (!mod) notFound();

  const questionsByExercise: Record<string, ExerciseQuestionRow[]> = {};
  await Promise.all(
    exercises.map(async (e) => {
      questionsByExercise[e.id] = await adminGetQuestionsForExercise(e.id);
    })
  );

  const nextOrder = exercises.length > 0 ? Math.max(...exercises.map((e) => e.order)) + 1 : 1;

  return (
    <div className="space-y-4">
      <nav>
        <Link
          href="/admin/modules"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to modules
        </Link>
      </nav>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Week {mod.week_number}
          </p>
          <Badge variant={mod.required_for_track === "both" ? "secondary" : "outline"}>
            {mod.required_for_track === "both" ? "Both tracks" : "Non-tech only"}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">{mod.title} — Exercises</h1>
          <Link
            href={`/admin/modules/${id}/quiz`}
            className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1.5 text-sm transition-colors"
          >
            <GraduationCap className="h-4 w-4" />
            Manage quiz
          </Link>
        </div>
      </header>

      <ExerciseListTable
        moduleId={id}
        exercises={exercises}
        questionsByExercise={questionsByExercise}
        nextOrder={nextOrder}
      />
    </div>
  );
}
