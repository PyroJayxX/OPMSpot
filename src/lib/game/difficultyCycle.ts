import { DifficultyTier } from "./types";

export const DIFFICULTY_CYCLE: DifficultyTier[] = [
  "easy",
  "medium",
  "hard",
  "expert",
  "impossible",
];

export function getDifficultyForRound(roundNumber: number): DifficultyTier {
  const index = (roundNumber - 1) % DIFFICULTY_CYCLE.length;
  return DIFFICULTY_CYCLE[index];
}
