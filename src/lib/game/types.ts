export type Decade = "2000s" | "2010s" | "2020s" | "any";

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
  roundNumber: number;
  currentTrack: SongPoolTrack | null;
  stageIndex: number;
  status: GameStatus;
  lastGuessWasWrong: boolean;
  streak: number;
}
