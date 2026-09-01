"use client";

import { Decade } from "@/lib/game/types";

const DECADES: { value: Decade; label: string }[] = [
  { value: "2000s", label: "2000s" },
  { value: "2010s", label: "2010s" },
  { value: "2020s", label: "2020s" },
  { value: "any", label: "Any era" },
];

interface DecadeTabsProps {
  decade: Decade;
  onChange: (decade: Decade) => void;
  disabled?: boolean;
}

export function DecadeTabs({ decade, onChange, disabled }: DecadeTabsProps) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-full border border-border bg-surface p-1 w-fit mx-auto">
      {DECADES.map((d) => (
        <button
          key={d.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(d.value)}
          className={
            "px-4 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-40 " +
            (decade === d.value
              ? "bg-accent text-accent-foreground"
              : "text-muted hover:text-foreground")
          }
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
