"use client";

import { TIER_COLORS } from "@/lib/game/tierColors";
import { DifficultyTier } from "@/lib/game/types";

const TIERS: { value: DifficultyTier; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "expert", label: "Expert" },
  { value: "impossible", label: "Impossible" },
];

interface DifficultyPillsProps {
  current: DifficultyTier;
  orientation: "row" | "column";
}

export function DifficultyPills({ current, orientation }: DifficultyPillsProps) {
  return (
    <div
      className={
        orientation === "row"
          ? "flex gap-2 flex-wrap justify-center"
          : "flex flex-col gap-2"
      }
    >
      {TIERS.map((tier) => {
        const isActive = tier.value === current;
        const color = TIER_COLORS[tier.value];
        return (
          <span
            key={tier.value}
            className={
              "text-sm font-semibold px-4 py-2 rounded-full border text-center transition-colors " +
              (orientation === "column" ? "w-full" : "")
            }
            style={
              isActive
                ? {
                    backgroundColor: `${color.accent}26`,
                    borderColor: color.accent,
                    color: color.accent,
                  }
                : {
                    backgroundColor: "transparent",
                    borderColor: "var(--border)",
                    color: "var(--muted)",
                  }
            }
          >
            {tier.label}
          </span>
        );
      })}
    </div>
  );
}
