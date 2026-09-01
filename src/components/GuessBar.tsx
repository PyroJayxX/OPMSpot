"use client";

import { useMemo, useState } from "react";
import { isLastPlayableStage } from "@/lib/game/reveal";
import { SongPoolTrack } from "@/lib/game/types";

interface GuessBarProps {
  pool: SongPoolTrack[];
  stageIndex: number;
  disabled: boolean;
  onSubmitGuess: (guess: string) => void;
  onSkip: () => void;
  onGiveUp: () => void;
}

export function GuessBar({
  pool,
  stageIndex,
  disabled,
  onSubmitGuess,
  onSkip,
  onGiveUp,
}: GuessBarProps) {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const hasGuess = value.trim().length > 0;
  const atLastStage = isLastPlayableStage(stageIndex);

  const buttonLabel = hasGuess ? "Guess" : atLastStage ? "Give up" : "Skip";

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (query.length < 2) return [];
    return pool
      .filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.artist.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [value, pool]);

  const submitGuess = (guess: string) => {
    onSubmitGuess(guess);
    setValue("");
    setShowSuggestions(false);
  };

  const selectSuggestion = (name: string) => {
    setValue(name);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      submitGuess(trimmed);
    } else if (atLastStage) {
      onGiveUp();
    } else {
      onSkip();
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            setShowSuggestions(true);
          }}
          placeholder="Guess the song title..."
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:outline-none focus:border-accent disabled:opacity-40"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={disabled}
          className="px-6 py-3 rounded-lg bg-accent text-accent-foreground text-base font-semibold hover:bg-accent-strong transition-colors disabled:opacity-30 whitespace-nowrap"
        >
          {buttonLabel}
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && !disabled && (
        <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-surface-raised border border-border rounded-lg shadow-lg text-base">
          {suggestions.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => selectSuggestion(track.name)}
                className="w-full text-left px-4 py-3 hover:bg-surface text-foreground"
              >
                {track.name} <span className="text-muted">— {track.artist}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
