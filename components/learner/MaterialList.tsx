import { MaterialRow } from "@/components/learner/MaterialRow";
import type { MaterialRow as MaterialRowType } from "@/lib/schemas/material";

type Props = {
  materials: MaterialRowType[];
  clickedIds: Set<string>;
  isLocked: boolean;
  prevModuleTitle?: string;
};

export function MaterialList({ materials, clickedIds, isLocked, prevModuleTitle }: Props) {
  if (materials.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">No materials yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {materials.map((material) => (
        <li key={material.id}>
          <MaterialRow
            materialId={material.id}
            title={material.title}
            type={material.type}
            isCompulsory={material.is_compulsory}
            isCompleted={clickedIds.has(material.id)}
            isLocked={isLocked}
            prevModuleTitle={prevModuleTitle}
          />
        </li>
      ))}
    </ul>
  );
}
