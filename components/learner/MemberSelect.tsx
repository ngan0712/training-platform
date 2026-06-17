"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type Learner = { id: string; name: string; email: string };

type Props = {
  learners: Learner[];
  value: string[];
  onChange: (ids: string[]) => void;
  max?: number;
};

export function MemberSelect({ learners, value, onChange, max = 4 }: Props) {
  const [query, setQuery] = useState("");

  const filtered =
    query.trim() === ""
      ? learners
      : learners.filter(
          (l) =>
            l.name.toLowerCase().includes(query.toLowerCase()) ||
            l.email.toLowerCase().includes(query.toLowerCase())
        );

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else if (value.length < max) {
      onChange([...value, id]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {learners.length === 0 ? (
        <p className="text-muted-foreground text-sm">No other learners available to invite.</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-2 text-center text-sm">
          No match for &quot;{query}&quot;
        </p>
      ) : (
        <div className="max-h-56 space-y-1.5 overflow-y-auto">
          {filtered.map((l) => {
            const checked = value.includes(l.id);
            const disabled = !checked && value.length >= max;
            return (
              <label
                key={l.id}
                className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                  checked
                    ? "border-primary bg-primary/5"
                    : disabled
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-muted"
                }`}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => toggle(l.id)}
                />
                <div className="min-w-0">
                  <p className="text-sm leading-none font-medium">{l.name}</p>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">{l.email}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {value.length >= max && (
        <p className="text-muted-foreground text-xs">Maximum {max} additional members selected.</p>
      )}
    </div>
  );
}
