"use client";

import { REVEAL_STAGES } from "@/lib/game/reveal";

interface RevealControlsProps {
  stageIndex: number;
  disabled: boolean;
  onNextStage: () => void;
  onGiveUp: () => void;
}

export function RevealControls({
  stageIndex,
  disabled,
  onNextStage,
  onGiveUp,
}: RevealControlsProps) {
  const isLastPlayableStage = stageIndex >= REVEAL_STAGES.length - 2;

  return (
    <button
      type="button"
      onClick={isLastPlayableStage ? onGiveUp : onNextStage}
      disabled={disabled}
      className="px-6 py-3 rounded-lg bg-accent text-accent-foreground text-base font-semibold hover:bg-accent-strong transition-colors disabled:opacity-30 whitespace-nowrap"
    >
      {isLastPlayableStage ? "Give up" : "Skip"}
    </button>
  );
}
