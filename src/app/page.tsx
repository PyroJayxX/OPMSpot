"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { AudioPlayer, AudioPlayerHandle } from "@/components/AudioPlayer";
import { DecadeTabs } from "@/components/DecadeTabs";
import { DifficultyPills } from "@/components/DifficultyPills";
import { PlaybackProgress } from "@/components/PlaybackProgress";
import { PlaybackSidebar } from "@/components/PlaybackSidebar";
import { PlayButton } from "@/components/PlayButton";
import { GuessBar } from "@/components/GuessBar";
import { RoundResult } from "@/components/RoundResult";
import { SourceTabs } from "@/components/SourceTabs";
import { StageSidebar } from "@/components/StageSidebar";
import { StreakCounter } from "@/components/StreakCounter";
import { VolumeControl } from "@/components/VolumeControl";
import { MAX_PREVIEW_SECONDS, REVEAL_STAGES } from "@/lib/game/reveal";
import { TIER_COLORS } from "@/lib/game/tierColors";
import { Decade, Source } from "@/lib/game/types";

const VOLUME_STORAGE_KEY = "opmspot-volume";
const SOURCE_STORAGE_KEY = "opmspot-source";

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
    reroll,
  } = useGame();

  // Deliberately NOT read from localStorage in these initializers: the
  // server always renders the plain default (no access to the browser's
  // storage), so seeding client state from localStorage here makes the
  // client's first render disagree with the server-rendered HTML. React
  // then has to silently reconcile that hydration mismatch, and which
  // value "wins" in the painted DOM ends up timing-dependent — that's the
  // bug where the source tabs sometimes visibly show Deezer selected while
  // the app is actually still running on the previously-saved iTunes
  // source underneath. Restoring the saved value in a mount-only effect
  // below keeps the first paint identical on server and client, so there's
  // nothing to reconcile.
  const [decade, setDecade] = useState<Decade>("any");
  const [source, setSource] = useState<Source>("deezer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<AudioPlayerHandle | null>(null);
  const skipVolumeWrite = useRef(true);
  const skipSourceWrite = useRef(true);

  // One-time sync from localStorage (a browser API unavailable during
  // SSR/the first client render), not derived React state; there's no way
  // to fold this into render without reintroducing the hydration mismatch
  // described above, so the two setState calls below are a deliberate,
  // narrow exception to react-hooks/set-state-in-effect.
  useEffect(() => {
    const storedSource = window.localStorage.getItem(SOURCE_STORAGE_KEY);
    if (storedSource === "itunes") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSource("itunes");
    }

    const storedVolume = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    const parsedVolume = storedVolume !== null ? Number(storedVolume) : NaN;
    if (!Number.isNaN(parsedVolume)) setVolume(parsedVolume);
  }, []);

  useEffect(() => {
    if (skipVolumeWrite.current) {
      skipVolumeWrite.current = false;
      return;
    }
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    if (skipSourceWrite.current) {
      skipSourceWrite.current = false;
      return;
    }
    window.localStorage.setItem(SOURCE_STORAGE_KEY, source);
  }, [source]);

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
        const res = await fetch(`/api/song-pool?decade=${decade}&source=${source}`);
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
  }, [decade, source, setPool, clearTrack]);

  useEffect(() => {
    if (!state.currentTrack) {
      audioRef.current?.stop();
      return;
    }

    if (state.status === "playing") {
      const seconds = REVEAL_STAGES[state.stageIndex].seconds;
      if (seconds !== null) {
        if (state.stageIndex === 0) {
          audioRef.current?.playFromStart(seconds);
        } else {
          audioRef.current?.continueTo(seconds);
        }
      }
    } else {
      audioRef.current?.playFromStart(MAX_PREVIEW_SECONDS);
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
    <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 pt-12 sm:pt-20 xl:pt-32 pb-8 sm:pb-14 flex flex-col gap-6 sm:gap-10 flex-1 min-h-0 overflow-y-auto">
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
          <button
            type="button"
            onClick={reroll}
            disabled={!state.currentTrack}
            className="flex items-center justify-center gap-2 mx-auto text-sm font-medium text-accent hover:text-accent-strong transition-colors disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.75 6h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z" />
            </svg>
            Reroll
          </button>
        </aside>

        <section className="flex flex-col gap-8 max-w-md mx-auto w-full">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Select streaming service
            </span>
            <SourceTabs source={source} onChange={setSource} disabled={loading} />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div />
            <DecadeTabs decade={decade} onChange={setDecade} disabled={loading} />
            <div className="flex justify-end">
              <StreakCounter streak={state.streak} />
            </div>
          </div>

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

                  <GuessBar
                    pool={state.pool}
                    stageIndex={state.stageIndex}
                    disabled={!isPlaying}
                    onSubmitGuess={submitGuess}
                    onSkip={nextStage}
                    onGiveUp={giveUp}
                  />

                  {state.lastGuessWasWrong && (
                    <p className="text-sm font-semibold text-danger text-center">
                      Incorrect!
                    </p>
                  )}
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
