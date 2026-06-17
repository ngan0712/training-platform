"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { chooseIndividual } from "../actions";

export function SoloChoiceButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handle() {
    startTransition(async () => {
      const result = await chooseIndividual();
      if (result.ok) {
        toast.success("You're going solo!");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button variant="outline" disabled={pending} onClick={handle} className="gap-2">
      <User className="h-4 w-4" />
      {pending ? "Saving…" : "Go solo"}
    </Button>
  );
}
