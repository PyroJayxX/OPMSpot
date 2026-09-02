"use client";

import { Source } from "@/lib/game/types";

const SOURCES: { value: Source; label: string }[] = [
  { value: "deezer", label: "Deezer" },
  { value: "itunes", label: "iTunes" },
];

interface SourceTabsProps {
  source: Source;
  onChange: (source: Source) => void;
  disabled?: boolean;
}

export function SourceTabs({ source, onChange, disabled }: SourceTabsProps) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-full border border-border bg-surface p-1 w-fit mx-auto">
      {SOURCES.map((s) => (
        <button
          key={s.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(s.value)}
          className={
            "px-4 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-40 " +
            (source === s.value
              ? "bg-accent text-accent-foreground"
              : "text-muted hover:text-foreground")
          }
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
