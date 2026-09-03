import { useCallback, useReducer } from "react";
import { isLastPlayableStage, REVEAL_STAGES } from "@/lib/game/reveal";
import { getDifficultyForRound } from "@/lib/game/difficultyCycle";
import { matchGuess } from "@/lib/game/matchGuess";
import { DIFFICULTY_CYCLE } from "@/lib/game/difficultyCycle";
import { DifficultyTier, GameState, SongPoolTrack } from "@/lib/game/types";

type Action =
  | { type: "SET_POOL"; pool: SongPoolTrack[] }
  | { type: "START_ROUND" }
  | { type: "NEXT_STAGE" }
  | { type: "SUBMIT_GUESS"; guess: string }
  | { type: "GIVE_UP" }
  | { type: "NEXT_ROUND" }
  | { type: "CLEAR_TRACK" };

const initialState: GameState = {
  pool: [],
  usedTrackIds: [],
  roundNumber: 1,
  currentTrack: null,
  stageIndex: 0,
  status: "playing",
  lastGuessWasWrong: false,
  streak: 0,
};

// How many of the most recent rounds' artists are off-limits for the next
// pick. Repeating an artist across a game is fine; back-to-back (or
// near-back-to-back) rounds from the same artist is what reads as broken.
const ARTIST_COOLDOWN_ROUNDS = 2;

function recentArtists(
  pool: SongPoolTrack[],
  usedTrackIds: string[],
  window: number
): Set<string> {
  const trackById = new Map(pool.map((t) => [t.id, t]));
  const artists = new Set<string>();
  for (const id of usedTrackIds.slice(-window)) {
    const track = trackById.get(id);
    if (track) artists.add(track.artist);
  }
  return artists;
}

function pickTrack(
  pool: SongPoolTrack[],
  usedTrackIds: string[],
  difficulty: DifficultyTier
): SongPoolTrack | null {
  const unused = pool.filter((t) => !usedTrackIds.includes(t.id));
  if (unused.length === 0) return null;

  // Avoid the artist(s) from the last couple of rounds; only allow a
  // repeat once every other option at every difficulty is exhausted.
  const cooldownArtists = recentArtists(pool, usedTrackIds, ARTIST_COOLDOWN_ROUNDS);
  const freshArtist = unused.filter((t) => !cooldownArtists.has(t.artist));
  const candidates = freshArtist.length > 0 ? freshArtist : unused;

  const byDifficulty = candidates.filter((t) => t.difficulty === difficulty);
  if (byDifficulty.length > 0) {
    return byDifficulty[Math.floor(Math.random() * byDifficulty.length)];
  }

  const startIndex = DIFFICULTY_CYCLE.indexOf(difficulty);
  for (let offset = 1; offset < DIFFICULTY_CYCLE.length; offset++) {
    const tier =
      DIFFICULTY_CYCLE[(startIndex + offset) % DIFFICULTY_CYCLE.length];
    const tierCandidates = candidates.filter((t) => t.difficulty === tier);
    if (tierCandidates.length > 0) {
      return tierCandidates[Math.floor(Math.random() * tierCandidates.length)];
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function startRound(state: GameState): GameState {
  const difficulty = getDifficultyForRound(state.roundNumber);
  const track = pickTrack(state.pool, state.usedTrackIds, difficulty);

  return {
    ...state,
    currentTrack: track,
    stageIndex: 0,
    status: "playing",
    lastGuessWasWrong: false,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_POOL":
      return startRound({
        ...state,
        pool: action.pool,
        usedTrackIds: [],
        roundNumber: 1,
        streak: 0,
      });

    case "START_ROUND":
      return startRound(state);

    case "NEXT_STAGE": {
      if (state.status !== "playing") return state;
      const nextIndex = Math.min(state.stageIndex + 1, REVEAL_STAGES.length - 1);
      return { ...state, stageIndex: nextIndex, lastGuessWasWrong: false };
    }

    case "SUBMIT_GUESS": {
      if (state.status !== "playing" || !state.currentTrack) return state;

      const isCorrect = matchGuess(action.guess, state.currentTrack.name);
      if (isCorrect) {
        return {
          ...state,
          status: "correct",
          lastGuessWasWrong: false,
          streak: state.streak + 1,
        };
      }

      if (isLastPlayableStage(state.stageIndex)) {
        return {
          ...state,
          status: "incorrect",
          stageIndex: REVEAL_STAGES.length - 1,
          lastGuessWasWrong: true,
          streak: 0,
        };
      }

      const nextIndex = Math.min(state.stageIndex + 1, REVEAL_STAGES.length - 1);
      return { ...state, stageIndex: nextIndex, lastGuessWasWrong: true };
    }

    case "GIVE_UP": {
      if (state.status !== "playing") return state;
      return {
        ...state,
        status: "revealed",
        stageIndex: REVEAL_STAGES.length - 1,
        lastGuessWasWrong: false,
        streak: 0,
      };
    }

    case "CLEAR_TRACK":
      return {
        ...state,
        pool: [],
        currentTrack: null,
        stageIndex: 0,
        status: "playing",
        lastGuessWasWrong: false,
      };

    case "NEXT_ROUND": {
      if (!state.currentTrack) return state;
      const usedTrackIds = [...state.usedTrackIds, state.currentTrack.id];
      return startRound({
        ...state,
        usedTrackIds,
        roundNumber: state.roundNumber + 1,
      });
    }

    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setPool = useCallback(
    (pool: SongPoolTrack[]) => dispatch({ type: "SET_POOL", pool }),
    []
  );
  const nextStage = useCallback(() => dispatch({ type: "NEXT_STAGE" }), []);
  const submitGuess = useCallback(
    (guess: string) => dispatch({ type: "SUBMIT_GUESS", guess }),
    []
  );
  const giveUp = useCallback(() => dispatch({ type: "GIVE_UP" }), []);
  const nextRound = useCallback(() => dispatch({ type: "NEXT_ROUND" }), []);
  const clearTrack = useCallback(() => dispatch({ type: "CLEAR_TRACK" }), []);

  const currentDifficulty = getDifficultyForRound(state.roundNumber);

  return {
    state,
    currentDifficulty,
    setPool,
    nextStage,
    submitGuess,
    giveUp,
    nextRound,
    clearTrack,
  };
}
