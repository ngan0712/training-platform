import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getModuleById } from "@/lib/db/modules";
import { adminGetQuizByModule } from "@/lib/db/quizzes";
import { Badge } from "@/components/ui/badge";
import { QuizPanel } from "@/components/admin/QuizPanel";

type Props = { params: Promise<{ id: string }> };

export default async function AdminQuizPage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const [mod, quiz] = await Promise.all([getModuleById(id), adminGetQuizByModule(id)]);

  if (!mod) notFound();

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
        <h1 className="text-2xl font-semibold">{mod.title} — Quiz</h1>
      </header>

      <QuizPanel moduleId={id} quiz={quiz} />
    </div>
  );
}
