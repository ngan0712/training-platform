import { Badge } from "@/components/ui/badge";
import type { SubmissionStatus } from "@/lib/schemas/exerciseSubmission";

const LABELS: Record<SubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  reviewed: "Reviewed",
};

const VARIANTS: Record<SubmissionStatus, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  submitted: "default",
  reviewed: "outline",
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus | null }) {
  if (!status) {
    return <Badge variant="secondary">Not started</Badge>;
  }
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
