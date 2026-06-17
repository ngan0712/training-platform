"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
};

export function ReorderButtons({ isFirst, isLast, onMoveUp, onMoveDown, disabled }: Props) {
  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isFirst || disabled}
        onClick={onMoveUp}
        aria-label="Move up"
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isLast || disabled}
        onClick={onMoveDown}
        aria-label="Move down"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
