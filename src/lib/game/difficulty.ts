import { DifficultyTier, SongPoolTrack } from "./types";

const TIER_ORDER: DifficultyTier[] = [
  "easy",
  "medium",
  "hard",
  "expert",
  "impossible",
];

/**
 * Deezer's `rank` field isn't a normalized 0-100 score like Spotify's old
 * `popularity` field — it's an unbounded, opaque integer. Bucket tracks into
 * quintiles by rank *within the fetched pool* instead of fixed thresholds.
 */
export function assignDifficultyTiers<T extends { rank: number }>(
  tracks: T[]
): Map<T, DifficultyTier> {
  const sorted = [...tracks].sort((a, b) => b.rank - a.rank);
  const tierSize = Math.ceil(sorted.length / TIER_ORDER.length) || 1;

  const result = new Map<T, DifficultyTier>();
  sorted.forEach((track, index) => {
    const tierIndex = Math.min(
      Math.floor(index / tierSize),
      TIER_ORDER.length - 1
    );
    result.set(track, TIER_ORDER[tierIndex]);
  });

  return result;
}

export function countByDifficulty(
  tracks: Pick<SongPoolTrack, "difficulty">[]
): Record<DifficultyTier, number> {
  const counts: Record<DifficultyTier, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
    impossible: 0,
  };
  for (const track of tracks) counts[track.difficulty]++;
  return counts;
}
