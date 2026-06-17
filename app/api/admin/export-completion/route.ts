import { getSessionUser } from "@/lib/auth/session";
import { getCohortCompletionMatrix } from "@/lib/db/reports";
import type { UserRow } from "@/lib/schemas/user";
import type { ModuleRow } from "@/lib/schemas/module";
import type { MaterialRow } from "@/lib/schemas/material";
import type { ExerciseRow } from "@/lib/schemas/exercise";
import type { ExerciseSubmissionRow } from "@/lib/schemas/exerciseSubmission";

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(fields: string[]): string {
  return fields.map(escapeCsv).join(",");
}

function visiblePairs(
  user: UserRow,
  modules: ModuleRow[],
  materials: MaterialRow[]
): { module: ModuleRow; material: MaterialRow }[] {
  const moduleById = new Map(modules.map((m) => [m.id, m]));
  const applicableModuleIds = new Set(
    modules
      .filter((m) => (user.track === "tech" ? m.required_for_track !== "non_tech_only" : true))
      .map((m) => m.id)
  );

  return materials
    .filter((mat) => applicableModuleIds.has(mat.module_id))
    .sort((a, b) => {
      const modA = moduleById.get(a.module_id)!;
      const modB = moduleById.get(b.module_id)!;
      if (modA.week_number !== modB.week_number) return modA.week_number - modB.week_number;
      if (modA.order !== modB.order) return modA.order - modB.order;
      return a.order - b.order;
    })
    .map((mat) => ({ module: moduleById.get(mat.module_id)!, material: mat }));
}

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return new Response("Unauthorized", { status: 401 });
  if (sessionUser.role !== "admin") return new Response("Forbidden", { status: 403 });

  const { users, modules, materials, exercises, clicksByUser, submissionsByUser } =
    await getCohortCompletionMatrix();

  const lines: string[] = [
    csvRow([
      "email",
      "name",
      "track",
      "week_number",
      "module_title",
      "material_title",
      "is_compulsory",
      "clicked_at",
      "exercise_title",
      "submission_status",
      "submission_outcome",
      "submitted_at",
    ]),
  ];

  // Material rows (existing columns; exercise columns are blank)
  for (const learner of users) {
    const clicks = clicksByUser.get(learner.id) ?? new Map<string, string>();
    for (const { module: mod, material: mat } of visiblePairs(learner, modules, materials)) {
      lines.push(
        csvRow([
          learner.email,
          learner.name,
          learner.track ?? "",
          String(mod.week_number),
          mod.title,
          mat.title,
          mat.is_compulsory ? "true" : "false",
          clicks.get(mat.id) ?? "",
          "",
          "",
          "",
          "",
        ])
      );
    }

    // Exercise rows (material columns are blank)
    const userSubs = submissionsByUser.get(learner.id) ?? new Map<string, ExerciseSubmissionRow>();
    const moduleById = new Map(modules.map((m) => [m.id, m]));
    const applicableExercises = exercises.filter((e) => {
      const mod = moduleById.get(e.module_id);
      if (!mod) return false;
      return learner.track === "tech" ? mod.required_for_track !== "non_tech_only" : true;
    });
    for (const ex of applicableExercises) {
      const mod = moduleById.get(ex.module_id)!;
      const sub = userSubs.get(ex.id);
      lines.push(
        csvRow([
          learner.email,
          learner.name,
          learner.track ?? "",
          String(mod.week_number),
          mod.title,
          "",
          "",
          "",
          ex.title,
          sub?.status ?? "",
          sub?.outcome ?? "",
          sub?.submitted_at ?? "",
        ])
      );
    }
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="completion.csv"',
    },
  });
}
