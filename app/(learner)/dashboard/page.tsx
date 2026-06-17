import { requireLearner } from "@/lib/auth/session";
import { getModules } from "@/lib/db/modules";
import { getAllMaterials } from "@/lib/db/materials";
import { getClicksByUser } from "@/lib/db/clicks";
import { getAllExercises } from "@/lib/db/exercises";
import { getSubmissionsByUser } from "@/lib/db/exerciseSubmissions";
import { getAllQuizzes, getPassingQuizIdsByUser } from "@/lib/db/quizzes";
import { getGroupForUser } from "@/lib/db/groups";
import { getParticipationModeField } from "@/lib/db/participationMode";
import { dashboardState } from "@/lib/domain/dashboardState";
import { isGroupFormationOpen } from "@/lib/domain/cutoffs";
import { ProgressRing } from "@/components/learner/ProgressRing";
import { TimelineStrip } from "@/components/learner/TimelineStrip";
import { ContinueCard } from "@/components/learner/ContinueCard";
import { GroupCard } from "@/components/learner/GroupCard";

export default async function DashboardPage() {
  const user = await requireLearner();

  const [
    modules,
    materials,
    clicks,
    groupWithMembers,
    participationModeField,
    exercises,
    submissions,
    quizzes,
    passingQuizIds,
  ] = await Promise.all([
    getModules(),
    getAllMaterials(),
    getClicksByUser(user.id),
    getGroupForUser(user.id),
    getParticipationModeField(user.id),
    getAllExercises(),
    getSubmissionsByUser(user.id),
    getAllQuizzes(),
    getPassingQuizIdsByUser(user.id),
  ]);

  const participationMode = groupWithMembers ? ("group" as const) : participationModeField;

  const state = dashboardState(
    modules,
    materials,
    clicks,
    exercises,
    submissions,
    quizzes,
    passingQuizIds
  );

  const totalCompulsory = state.modules.reduce((sum, m) => sum + m.completion.compulsoryTotal, 0);
  const clickedCompulsory = state.modules.reduce(
    (sum, m) => sum + m.completion.compulsoryClicked,
    0
  );

  // Fall back to the next module (even if locked) when nothing is in progress.
  const continueEntry = state.currentModule ?? state.modules.find((m) => !m.completion.isComplete);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
      </div>

      {/* Progress ring */}
      <section>
        <h2 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
          Overall Progress
        </h2>
        <ProgressRing clicked={clickedCompulsory} total={totalCompulsory} />
      </section>

      {/* Timeline */}
      <section>
        <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
          Programme Timeline
        </h2>
        <TimelineStrip state={state} />
      </section>

      {/* Continue + Group cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {continueEntry ? (
          <ContinueCard entry={continueEntry} />
        ) : (
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm font-medium">All done!</p>
            <p className="text-muted-foreground mt-1 text-sm">
              You&apos;ve completed all compulsory materials.
            </p>
          </div>
        )}
        <GroupCard
          groupWithMembers={groupWithMembers}
          participationMode={participationMode}
          isFormationOpen={isGroupFormationOpen()}
        />
      </div>
    </div>
  );
}
