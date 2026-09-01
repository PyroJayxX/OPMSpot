"use client";

import { REVEAL_STAGES } from "@/lib/game/reveal";

const PLAYABLE_STAGES = REVEAL_STAGES.slice(0, -1);

interface StageSidebarProps {
  stageIndex: number;
}

export function StageSidebar({ stageIndex }: StageSidebarProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        Guess after
      </span>
      <div className="grid grid-cols-3 gap-2">
        {PLAYABLE_STAGES.map((stage, index) => (
          <span
            key={stage.label}
            className={
              "text-sm font-semibold text-center px-3 py-2 rounded-lg border transition-colors " +
              (index === stageIndex
                ? "bg-accent text-accent-foreground border-accent"
                : index < stageIndex
                ? "bg-surface text-muted border-border"
                : "bg-transparent text-muted/60 border-border")
            }
          >
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  );
}
