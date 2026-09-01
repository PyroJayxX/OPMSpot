"use client";

import { Flame } from "lucide-react";

const GLOW_CAP = 5;

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  const isActive = streak > 0;
  const intensity = Math.min(streak, GLOW_CAP) / GLOW_CAP;

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all"
      style={
        isActive
          ? {
              color: "var(--accent)",
              backgroundColor: `color-mix(in srgb, var(--accent) ${10 + intensity * 15}%, transparent)`,
              boxShadow: `0 0 ${4 + intensity * 16}px ${intensity * 2}px color-mix(in srgb, var(--accent) ${40 + intensity * 40}%, transparent)`,
            }
          : { color: "var(--muted)" }
      }
    >
      <Flame
        className="w-4 h-4"
        fill={isActive ? "currentColor" : "none"}
        strokeWidth={isActive ? 2 : 1.5}
      />
      <span>{streak}</span>
    </div>
  );
}
