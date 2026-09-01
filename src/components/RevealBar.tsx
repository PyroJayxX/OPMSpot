"use client";

import { REVEAL_STAGES } from "@/lib/game/reveal";

const PLAYABLE_STAGES = REVEAL_STAGES.slice(0, -1);

interface RevealBarProps {
  stageIndex: number;
}

export function RevealBar({ stageIndex }: RevealBarProps) {
  const clampedIndex = Math.min(stageIndex, PLAYABLE_STAGES.length - 1);

  return (
    <div className="flex gap-1 h-3">
      {PLAYABLE_STAGES.map((stage, index) => (
        <div
          key={stage.label}
          style={{ flex: `${stage.seconds} 0 6px` }}
          className={
            "rounded-full transition-colors " +
            (index <= clampedIndex ? "bg-accent" : "bg-border")
          }
        />
      ))}
    </div>
  );
}
