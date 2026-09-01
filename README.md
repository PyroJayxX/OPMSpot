# OPMSpot

Guess the OPM (Original Pilipino Music) song from a short audio clip. Each round plays a growing snippet — 0.1s → 0.5s → 2s → 8s → 15s → 30s — until you guess it or give up.

Inspired by [Songspot.net](https://songspot.net/).

## How it works

- **Song source**: [Deezer](https://www.deezer.com)'s public API, no auth required. Tracks come from hand-picked, spot-checked OPM playlists grouped by decade (2000s / 2010s / 2020s), since Deezer has no official "OPM by decade" catalog.
- **Difficulty**: each round auto-cycles through Easy → Medium → Hard → Expert → Impossible → back to Easy (4 Pics 1 Word style — not player-selectable). Tiers are computed by bucketing the current pool into quintiles of Deezer's `rank` field.
- **Playback**: Deezer's 30-second preview MP3s via a plain `<audio>` element. Skip continues playback from wherever it stopped; the replay button restarts from 0.
- **UI theme**: the accent color across the whole page shifts to match the current round's difficulty tier.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables or API keys are needed — Deezer's search/playlist endpoints are public.

## Project structure

```
src/
  app/
    page.tsx                  # main game screen
    api/song-pool/route.ts    # GET pool by decade
  components/                 # UI components
  hooks/useGame.ts            # game state (useReducer)
  lib/
    deezer/                   # Deezer API client + types
    game/                     # reveal stages, difficulty tiers, guess matching, pool selection
```

## Known limitations

- Decade pools are sourced from community-curated Deezer playlists (Deezer has no official OPM-by-decade catalog), spot-checked for genuine OPM content but not guaranteed perfectly clean.
- Not every track has a preview available; those are filtered out silently when building each pool.
