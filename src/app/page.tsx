"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { AudioPlayer, AudioPlayerHandle } from "@/components/AudioPlayer";
import { DecadeTabs } from "@/components/DecadeTabs";
import { DifficultyPills } from "@/components/DifficultyPills";
import { PlaybackProgress } from "@/components/PlaybackProgress";
import { PlaybackSidebar } from "@/components/PlaybackSidebar";
import { PlayButton } from "@/components/PlayButton";
import { RevealControls } from "@/components/RevealControls";
import { GuessForm } from "@/components/GuessForm";
import { RoundResult } from "@/components/RoundResult";
import { StageSidebar } from "@/components/StageSidebar";
import { VolumeControl } from "@/components/VolumeControl";
import { REVEAL_STAGES } from "@/lib/game/reveal";
import { TIER_COLORS } from "@/lib/game/tierColors";
import { Decade } from "@/lib/game/types";

const VOLUME_STORAGE_KEY = "opmspot-volume";

export default function Home() {
  const {
    state,
    currentDifficulty,
    setPool,
    nextStage,
    submitGuess,
    giveUp,
    nextRound,
    clearTrack,
  } = useGame();

  const [decade, setDecade] = useState<Decade>("any");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 0.5;
    const stored = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    const parsed = stored !== null ? Number(stored) : NaN;
    return Number.isNaN(parsed) ? 0.5 : parsed;
  });
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<AudioPlayerHandle | null>(null);

  useEffect(() => {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    const color = TIER_COLORS[currentDifficulty];
    const root = document.documentElement.style;
    root.setProperty("--accent", color.accent);
    root.setProperty("--accent-strong", color.accentStrong);
    root.setProperty("--accent-foreground", color.accentForeground);
  }, [currentDifficulty]);

  useEffect(() => {
    let cancelled = false;

    async function loadPool() {
      setLoading(true);
      setError(null);
      audioRef.current?.stop();
      clearTrack();
      try {
        const res = await fetch(`/api/song-pool?decade=${decade}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Request failed (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) setPool(data.tracks);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load songs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPool();
    return () => {
      cancelled = true;
    };
  }, [decade, setPool, clearTrack]);

  useEffect(() => {
    if (state.status === "playing" && state.currentTrack) {
      const seconds = REVEAL_STAGES[state.stageIndex].seconds;
      if (seconds !== null) {
        if (state.stageIndex === 0) {
          audioRef.current?.playFromStart(seconds);
        } else {
          audioRef.current?.continueTo(seconds);
        }
      }
    } else {
      audioRef.current?.stop();
    }
  }, [state.stageIndex, state.status, state.currentTrack]);

  const currentStageSeconds = REVEAL_STAGES[state.stageIndex].seconds;
  const isPlaying = state.status === "playing";

  const replayClip = () => {
    if (currentStageSeconds !== null) {
      audioRef.current?.playFromStart(currentStageSeconds);
    }
  };

  return (
    <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 pt-12 sm:pt-20 lg:pt-32 pb-8 sm:pb-14 flex flex-col gap-6 sm:gap-10 flex-1">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          <span className="text-accent">OPM</span>Spot
        </h1>
        <p className="text-sm sm:text-base text-muted mt-2">Guess the OPM song from a short clip.</p>
      </div>

      {state.currentTrack && (
        <AudioPlayer
          ref={audioRef}
          src={state.currentTrack.previewUrl}
          volume={volume}
          onProgress={setProgress}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_260px] gap-6 lg:gap-16 items-start">
        <aside className="hidden lg:flex flex-col gap-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Difficulty
          </span>
          <DifficultyPills current={currentDifficulty} orientation="column" />
        </aside>

        <section className="flex flex-col gap-8 max-w-md mx-auto w-full">
          <DecadeTabs decade={decade} onChange={setDecade} disabled={loading} />

          <div className="flex justify-center">
            <DifficultyPills current={currentDifficulty} orientation="row" />
          </div>

          {loading && <p className="text-center text-muted text-sm py-4">Loading songs…</p>}
          {error && <p className="text-center text-danger text-sm py-4">{error}</p>}

          {!loading && !error && !state.currentTrack && (
            <p className="text-center text-muted text-sm py-4">
              No songs available for this filter. Try a different decade.
            </p>
          )}

          {!loading && state.currentTrack && (
            <div className="flex flex-col gap-6">
              {isPlaying && (
                <>
                  <PlaybackProgress progress={progress} stageIndex={state.stageIndex} />

                  <PlayButton
                    label={
                      currentStageSeconds !== null ? `${currentStageSeconds}s` : ""
                    }
                    onClick={replayClip}
                    disabled={currentStageSeconds === null}
                  />

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <GuessForm
                      pool={state.pool}
                      disabled={!isPlaying}
                      onSubmit={submitGuess}
                    />
                    <RevealControls
                      stageIndex={state.stageIndex}
                      disabled={!isPlaying}
                      onNextStage={nextStage}
                      onGiveUp={giveUp}
                    />
                  </div>
                </>
              )}

              {state.status !== "playing" && (
                <RoundResult
                  track={state.currentTrack}
                  status={state.status}
                  guessedAtLabel={REVEAL_STAGES[state.stageIndex].label}
                  onNextRound={nextRound}
                />
              )}

              <div className="lg:hidden flex flex-col gap-6">
                <StageSidebar stageIndex={state.stageIndex} />
                <VolumeControl volume={volume} onChange={setVolume} />
              </div>
            </div>
          )}
        </section>

        <aside className="hidden lg:flex flex-col gap-8">
          <PlaybackSidebar onReplay={replayClip} disabled={!isPlaying} />
          <StageSidebar stageIndex={state.stageIndex} />
          <VolumeControl volume={volume} onChange={setVolume} />
        </aside>
      </div>
    </main>
  );
}
