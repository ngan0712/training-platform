import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getUserCompletion } from "@/lib/db/reports";
import { UserDrillIn } from "@/components/admin/UserDrillIn";

type Props = { params: Promise<{ id: string }> };

export default async function AdminUserPage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const data = await getUserCompletion(id);
  if (!data) notFound();

  return (
    <UserDrillIn
      user={data.user}
      modules={data.modules}
      materials={data.materials}
      clicks={data.clicks}
      exercises={data.exercises}
      submissions={data.submissions}
      quizzes={data.quizzes}
      quizAttempts={data.quizAttempts}
    />
  );
}
