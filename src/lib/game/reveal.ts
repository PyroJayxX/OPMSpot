export const REVEAL_STAGES = [
  { label: "0.1s", seconds: 0.1 },
  { label: "0.5s", seconds: 0.5 },
  { label: "2s", seconds: 2 },
  { label: "8s", seconds: 8 },
  { label: "15s", seconds: 15 },
  { label: "30s", seconds: 30 },
  { label: "Give up", seconds: null },
] as const;

export type RevealStage = (typeof REVEAL_STAGES)[number];

export function isLastPlayableStage(stageIndex: number): boolean {
  return stageIndex >= REVEAL_STAGES.length - 2;
}

export const MAX_PREVIEW_SECONDS = REVEAL_STAGES[REVEAL_STAGES.length - 2]
  .seconds as number;
