import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ModuleDashboardEntry } from "@/lib/domain/dashboardState";

export function ContinueCard({ entry }: { entry: ModuleDashboardEntry }) {
  const { module, completion } = entry;

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Continue
        </p>
        <CardTitle className="text-base">{module.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Week {module.week_number} &middot; {completion.compulsoryClicked}/
          {completion.compulsoryTotal} compulsory done
        </p>
        <Link
          href={`/modules/${module.id}`}
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
        >
          Open module
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
