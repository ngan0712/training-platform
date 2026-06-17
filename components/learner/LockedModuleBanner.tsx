import { Lock } from "lucide-react";

export function LockedModuleBanner({ prevModuleTitle }: { prevModuleTitle?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-raised)] p-4">
      <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--state-locked)]" />
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Module locked</p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {prevModuleTitle
            ? `Complete all compulsory materials in "${prevModuleTitle}" to unlock this module.`
            : "Complete all compulsory materials in the previous module to unlock this one."}
        </p>
      </div>
    </div>
  );
}
