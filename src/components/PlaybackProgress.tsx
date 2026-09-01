"use client";

import { REVEAL_STAGES } from "@/lib/game/reveal";

const RAW_STAGES = REVEAL_STAGES.slice(0, -1).map((stage) => ({
  label: stage.label,
  seconds: stage.seconds as number,
}));

const TOTAL_SECONDS = RAW_STAGES[RAW_STAGES.length - 1].seconds;

const SEGMENTS = RAW_STAGES.map((stage, index) => ({
  label: stage.label,
  start: index === 0 ? 0 : RAW_STAGES[index - 1].seconds,
  end: stage.seconds,
}));

interface PlaybackProgressProps {
  progress: number;
  stageIndex: number;
}

export function PlaybackProgress({ progress, stageIndex }: PlaybackProgressProps) {
  const clampedIndex = Math.min(stageIndex, RAW_STAGES.length - 1);
  const capSeconds = RAW_STAGES[clampedIndex].seconds;
  const fillPercent = Math.min((progress / TOTAL_SECONDS) * 100, 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-2.5 rounded-full overflow-hidden bg-border">
        {SEGMENTS.map((segment, index) => {
          const left = (segment.start / TOTAL_SECONDS) * 100;
          const width = ((segment.end - segment.start) / TOTAL_SECONDS) * 100;
          const isSkipped = index <= clampedIndex;

          return (
            <div
              key={segment.label}
              className="absolute inset-y-0"
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              {isSkipped && (
                <div
                  className="absolute inset-0 bg-accent"
                  style={{ opacity: 0.35 }}
                />
              )}
              {index > 0 && (
                <div className="absolute inset-y-0 left-0 w-px bg-background/60" />
              )}
            </div>
          );
        })}

        <div
          className="absolute inset-y-0 left-0 bg-accent rounded-full"
          style={{ width: `${fillPercent}%`, transition: "width 100ms linear" }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted tabular-nums">
        <span>{progress.toFixed(1)}s</span>
        <span>cap {capSeconds}s</span>
      </div>
    </div>
  );
}
