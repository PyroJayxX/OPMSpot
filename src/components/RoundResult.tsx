"use client";

import Image from "next/image";
import { DifficultyTier, GameStatus, SongPoolTrack } from "@/lib/game/types";

const DIFFICULTY_LABELS: Record<DifficultyTier, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
  impossible: "Impossible",
};

interface RoundResultProps {
  track: SongPoolTrack;
  status: GameStatus;
  guessedAtLabel: string;
  onNextRound: () => void;
}

export function RoundResult({
  track,
  status,
  guessedAtLabel,
  onNextRound,
}: RoundResultProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center border border-border rounded-xl p-8 bg-surface">
      <p
        className={
          "text-base font-semibold uppercase tracking-wide " +
          (status === "correct" ? "text-success" : "text-danger")
        }
      >
        {status === "correct"
          ? `Guessed in ${guessedAtLabel}!`
          : status === "incorrect"
          ? "Incorrect!"
          : "Gave up!"}
      </p>

      {track.albumArtUrl && (
        <Image
          src={track.albumArtUrl}
          alt={track.name}
          width={160}
          height={160}
          className="rounded-lg border border-border"
        />
      )}

      <div>
        <p className="text-lg font-semibold text-foreground">{track.name}</p>
        <p className="text-base text-muted">{track.artist}</p>
      </div>

      <span className="text-sm px-3 py-1.5 rounded-full bg-surface-raised text-foreground border border-border">
        {DIFFICULTY_LABELS[track.difficulty]}
      </span>

      <button
        type="button"
        onClick={onNextRound}
        className="px-6 py-3 rounded-lg bg-accent text-accent-foreground text-base font-semibold hover:bg-accent-strong transition-colors"
      >
        Next round
      </button>
    </div>
  );
}
