import { ModuleNode } from "./ModuleNode";
import type { DashboardState } from "@/lib/domain/dashboardState";

type Props = {
  state: DashboardState;
};

export function TimelineStrip({ state }: Props) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4 px-1 py-2">
        {state.modules.map((entry, i) => {
          const isCurrent = entry.module.id === state.currentModule?.module.id;

          let nodeState: "done" | "current" | "locked";
          if (!entry.isUnlocked) {
            nodeState = "locked";
          } else if (isCurrent) {
            nodeState = "current";
          } else if (entry.completion.isComplete || entry.completion.compulsoryTotal === 0) {
            nodeState = "done";
          } else {
            nodeState = "current";
          }

          const prevTitle = i > 0 ? state.modules[i - 1].module.title : undefined;

          return (
            <ModuleNode
              key={entry.module.id}
              id={entry.module.id}
              title={entry.module.title}
              weekNumber={entry.module.week_number}
              state={nodeState}
              prevModuleTitle={prevTitle}
              completion={entry.completion}
            />
          );
        })}
      </div>
    </div>
  );
}
