export type Decade = "2000s" | "2010s" | "2020s" | "any";

export type Source = "deezer" | "itunes";

export type DifficultyTier = "easy" | "medium" | "hard" | "expert" | "impossible";

export interface SongPoolTrack {
  id: string;
  name: string;
  artist: string;
  albumArtUrl: string | null;
  previewUrl: string;
  popularity: number;
  difficulty: DifficultyTier;
}

export type GameStatus = "playing" | "correct" | "incorrect" | "revealed";

export interface GameState {
  pool: SongPoolTrack[];
  usedTrackIds: string[];
  // Artist names from the last few rounds, independent of `pool`/
  // `usedTrackIds` so the cooldown survives a decade/source switch instead
  // of resetting to empty right when a new pool loads.
  recentArtists: string[];
  roundNumber: number;
  currentTrack: SongPoolTrack | null;
  stageIndex: number;
  status: GameStatus;
  lastGuessWasWrong: boolean;
  streak: number;
}
