import { ExerciseRow } from "@/components/learner/ExerciseRow";
import type { ExerciseRow as ExerciseRowType } from "@/lib/schemas/exercise";
import type { ExerciseSubmissionRow } from "@/lib/schemas/exerciseSubmission";

type Props = {
  exercises: ExerciseRowType[];
  submissions: ExerciseSubmissionRow[];
  isLocked: boolean;
  prevModuleTitle?: string;
};

export function ExerciseList({ exercises, submissions, isLocked, prevModuleTitle }: Props) {
  if (exercises.length === 0) return null;

  const subsByExercise = new Map(submissions.map((s) => [s.exercise_id, s]));

  return (
    <div className="flex flex-col gap-2">
      {exercises.map((exercise) => {
        const sub = subsByExercise.get(exercise.id);
        return (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            submissionStatus={sub?.status ?? null}
            isLocked={isLocked}
            prevModuleTitle={prevModuleTitle}
          />
        );
      })}
    </div>
  );
}
