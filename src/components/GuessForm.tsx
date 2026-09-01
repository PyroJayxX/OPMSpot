"use client";

import { useMemo, useState } from "react";
import { SongPoolTrack } from "@/lib/game/types";

interface GuessFormProps {
  pool: SongPoolTrack[];
  disabled: boolean;
  onSubmit: (guess: string) => void;
}

export function GuessForm({ pool, disabled, onSubmit }: GuessFormProps) {
  const [value, setValue] = useState("");

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

  const submit = (guess: string) => {
    if (!guess.trim()) return;
    onSubmit(guess);
    setValue("");
  };

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Guess the song title..."
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:outline-none focus:border-accent disabled:opacity-40"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={disabled}
          className="px-6 py-3 rounded-lg bg-accent text-accent-foreground text-base font-semibold hover:bg-accent-strong transition-colors disabled:opacity-30"
        >
          Guess
        </button>
      </form>

      {suggestions.length > 0 && !disabled && (
        <ul className="absolute z-10 mt-1 w-full bg-surface-raised border border-border rounded-lg shadow-lg text-base overflow-hidden">
          {suggestions.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => submit(track.name)}
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
