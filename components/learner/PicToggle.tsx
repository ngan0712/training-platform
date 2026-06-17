"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Member = { userId: string; name: string };

type Props = {
  members: Member[];
  value: string;
  onChange: (userId: string) => void;
};

export function PicToggle({ members, value, onChange }: Props) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
      {members.map((m) => (
        <label
          key={m.userId}
          htmlFor={`pic-${m.userId}`}
          className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
            value === m.userId ? "border-primary bg-primary/5" : "hover:bg-muted"
          }`}
        >
          <RadioGroupItem value={m.userId} id={`pic-${m.userId}`} />
          <span className="text-sm font-medium">{m.name}</span>
        </label>
      ))}
    </RadioGroup>
  );
}
