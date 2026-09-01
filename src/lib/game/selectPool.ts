import { deezerFetch } from "../deezer/client";
import { DeezerPlaylistTracksResponse, DeezerTrack } from "../deezer/types";
import { assignDifficultyTiers } from "./difficulty";
import { Decade, SongPoolTrack } from "./types";

/**
 * Deezer's search API heavily biases toward current-year releases, and
 * search results don't carry release_date (only /track/{id} does, which
 * would mean one lookup per candidate). Deezer has no editorial "OPM by
 * decade" playlists, so these are hand-picked community playlists spot-
 * checked for genuine OPM content and reasonable preview availability.
 */
const DECADE_PLAYLIST_IDS: Record<Exclude<Decade, "any">, number[]> = {
  "2000s": [
    15560518803, 15121463363, 4013140202, 15627187843, 7889423282, 6353593144,
  ],
  "2010s": [15565565283, 9965429122, 9100368982, 839889163, 3361564846, 5768283142],
  "2020s": [
    13673770861, 13857467821, 14975534203, 8345085322, 9685895102, 13199979203,
    13387390203, 15045356243,
  ],
};

function normalizeKey(track: DeezerTrack): string {
  return `${track.title.toLowerCase().trim()}::${track.artist.name
    .toLowerCase()
    .trim()}`;
}

function toSongPoolTrack(
  track: DeezerTrack,
  difficulty: SongPoolTrack["difficulty"]
): SongPoolTrack {
  return {
    id: String(track.id),
    name: track.title,
    artist: track.artist.name,
    albumArtUrl: track.album.cover_medium ?? null,
    previewUrl: track.preview,
    popularity: track.rank,
    difficulty,
  };
}

function playlistIdsForDecade(decade: Decade): number[] {
  if (decade === "any") {
    return Object.values(DECADE_PLAYLIST_IDS).flat();
  }
  return DECADE_PLAYLIST_IDS[decade];
}

export async function fetchSongPool(decade: Decade): Promise<SongPoolTrack[]> {
  const playlistIds = playlistIdsForDecade(decade);

  const results = await Promise.all(
    playlistIds.map((id) =>
      deezerFetch<DeezerPlaylistTracksResponse>(`/playlist/${id}/tracks`, {
        limit: "100",
      }).catch(() => null)
    )
  );

  const byId = new Map<number, DeezerTrack>();
  const seenKeys = new Set<string>();

  for (const result of results) {
    if (!result) continue;
    for (const track of result.data) {
      if (!track.preview) continue;
      if (byId.has(track.id)) continue;

      const key = normalizeKey(track);
      if (seenKeys.has(key)) continue;

      byId.set(track.id, track);
      seenKeys.add(key);
    }
  }

  const tracks = Array.from(byId.values());
  const difficultyByTrack = assignDifficultyTiers(tracks);

  return tracks.map((track) =>
    toSongPoolTrack(track, difficultyByTrack.get(track) ?? "impossible")
  );
}
