import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ClipboardList, GraduationCap, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getModuleById } from "@/lib/db/modules";
import { getMaterialsByModule } from "@/lib/db/materials";
import { getExercisesByModule } from "@/lib/db/exercises";
import { adminGetQuizByModule } from "@/lib/db/quizzes";
import { MaterialListTable } from "@/components/admin/MaterialListTable";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ id: string }> };

export default async function AdminMaterialsPage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const [mod, materials, exercises, quiz] = await Promise.all([
    getModuleById(id),
    getMaterialsByModule(id),
    getExercisesByModule(id),
    adminGetQuizByModule(id),
  ]);

  if (!mod) notFound();

  const sortedExercises = [...exercises].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
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
        <h1 className="text-2xl font-semibold">{mod.title}</h1>
        {mod.description && <p className="text-muted-foreground text-sm">{mod.description}</p>}
      </header>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Materials
        </h2>
        <MaterialListTable moduleId={id} materials={materials} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Exercises
          </h2>
          <Link
            href={`/admin/modules/${id}/exercises`}
            className="border-input bg-background hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] border px-3 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Manage exercises
          </Link>
        </div>

        {sortedExercises.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
            No exercises yet.{" "}
            <Link
              href={`/admin/modules/${id}/exercises`}
              className="hover:text-foreground underline underline-offset-2"
            >
              Add the first one.
            </Link>
          </p>
        ) : (
          <div className="divide-y rounded-lg border text-sm">
            {sortedExercises.map((ex) => (
              <div key={ex.id} className="flex items-center gap-3 px-4 py-3">
                <ClipboardList className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-medium">{ex.title}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={ex.is_compulsory ? "default" : "secondary"}>
                    {ex.is_compulsory ? "Compulsory" : "Optional"}
                  </Badge>
                  <Link
                    href={`/admin/modules/${id}/exercises`}
                    className="text-muted-foreground text-xs underline-offset-2 hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Quiz
          </h2>
          <Link
            href={`/admin/modules/${id}/quiz`}
            className="border-input bg-background hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] border px-3 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            {quiz ? "Manage quiz" : "Add quiz"}
          </Link>
        </div>

        {!quiz ? (
          <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
            No quiz yet.{" "}
            <Link
              href={`/admin/modules/${id}/quiz`}
              className="hover:text-foreground underline underline-offset-2"
            >
              Create one.
            </Link>
          </p>
        ) : (
          <div className="divide-y rounded-lg border text-sm">
            <div className="flex items-center gap-3 px-4 py-3">
              <GraduationCap className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-medium">{quiz.title}</span>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={quiz.is_compulsory ? "default" : "secondary"}>
                  {quiz.is_compulsory ? "Compulsory" : "Optional"}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""} · pass at{" "}
                  {quiz.pass_threshold}%
                </span>
                <Link
                  href={`/admin/modules/${id}/quiz`}
                  className="text-muted-foreground text-xs underline-offset-2 hover:underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
