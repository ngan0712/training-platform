"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { switchToSolo } from "../actions";

export function SwitchToSoloButton({ groupId }: { groupId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handle() {
    startTransition(async () => {
      const result = await switchToSolo(groupId);
      if (result.ok) {
        toast.success("Switched to solo");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={handle}
      className="text-muted-foreground hover:text-foreground"
    >
      <User className="mr-2 h-4 w-4" />
      {pending ? "Switching…" : "Switch to solo instead"}
    </Button>
  );
}
