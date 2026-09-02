import { itunesSearch } from "../itunes/client";
import { ItunesTrack } from "../itunes/types";
import { assignDifficultyTiers } from "./difficulty";
import { Decade, SongPoolTrack } from "./types";

/**
 * The free iTunes Search API has no genre filter and no "OPM" tag, and
 * generic queries ("OPM hits") pull in whatever international pop happens
 * to match. So instead of searching by keyword, this searches by a
 * hand-picked list of genuine OPM artists spanning legacy OPM, 2000s-2020s
 * bands/pop, and the Fliptop-era rap scene (mirrors the spirit of Deezer's
 * hand-picked playlists), then filters each artist's catalog to the
 * requested decade via releaseDate. Ordered roughly mainstream-to-niche;
 * that order also seeds the difficulty ranking below since iTunes gives no
 * popularity score.
 */
const OPM_ARTISTS = [
  "Eraserheads", "Rivermaya", "Parokya ni Edgar", "Sarah Geronimo", "Regine Velasquez",
  "Gary Valenciano", "Martin Nievera", "Bamboo", "Freddie Aguilar", "APO Hiking Society",
  "Francis Magalona", "SB19", "BINI",

  "Sponge Cola", "Callalily", "Hale", "Kamikazee", "Yeng Constantino", "Rico Blanco",
  "Silent Sanctuary", "December Avenue", "Juan Karlos", "Ben&Ben", "Moira Dela Torre",
  "Up Dharma Down", "Itchyworms", "Mayonnaise", "Christian Bautista", "Erik Santos",
  "Ogie Alcasid",

  "Zack Tabudlo", "IV of Spades", "Cup of Joe", "Arthur Nery", "Dionela", "Adie",
  "Lola Amour", "Dilaw", "TJ Monterde", "The Juans", "I Belong to the Zoo", "Franco",
  "SunKissed Lola", "Maki",

  "Gloc-9", "Shanti Dope", "Abra", "Loonie", "Smugglaz", "Shehyee", "Hev Abi", "Flow G",
  "Skusta Clee", "Al James", "O Side Mafia", "Yuridope", "Hellmerry", "Omar Baliw",
  "Ex Battalion", "Because", "Pricetagg", "Bugoy na Koykoy", "Nateman", "Lo ki",
  "Gat Putch", "gins&melodies", "Unotheone", "Kristina Dawn", "Simmo", "Tu Brother",
  "OLG Zak",

  "Sugarfree", "Chicosci", "Urbandub", "Orange & Lemons", "Cueshe", "This Band",
  "Munimuni", "fitterkarma", "Nobita", "Janine Berdin", "Autotelic", "Sud",
  "Syd Hartha", "Unique Salonga", "Rey Valera", "Rico J. Puno", "Hajji Alejandro",
  "Basil Valdez", "Noel Cabangon", "Ebe Dancel", "Andrew E.", "Juan de la Cruz Band",
  "Asin", "Sampaguita", "Joey Ayala",
];

// iTunes' search API has an undocumented per-IP burst limit — firing all
// artist queries in one Promise.all (~90+) reliably 403s some of them and
// can trip a longer cooldown. Chunking keeps each burst well under that.
const FETCH_CHUNK_SIZE = 15;

// Decade filtering is just an in-memory pass over this, so the network
// fetch (the expensive, rate-limit-sensitive part) is cached once across
// all decades/requests rather than re-run per decade or per page load.
const CATALOG_CACHE_TTL_MS = 15 * 60 * 1000;
let catalogCache: { entries: RankedTrack[]; expiresAt: number } | null = null;

interface RankedTrack {
  track: ItunesTrack;
  rank: number;
}

// Matches combining diacritical marks (U+0300-U+036F) left behind by NFD
// normalization, e.g. "Cueshé" -> "Cueshé" -> "Cueshe".
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function normalizeToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isArtistMatch(resultArtist: string, queryArtist: string): boolean {
  const a = normalizeToken(resultArtist);
  const b = normalizeToken(queryArtist);
  return a.length > 0 && b.length > 0 && (a.includes(b) || b.includes(a));
}

function trackYear(track: ItunesTrack): number | null {
  const year = track.releaseDate ? Number(track.releaseDate.slice(0, 4)) : NaN;
  return Number.isNaN(year) ? null : year;
}

const DECADE_YEAR_RANGES: Record<Exclude<Decade, "any">, [number, number]> = {
  "2000s": [2000, 2009],
  "2010s": [2010, 2019],
  "2020s": [2020, 2029],
};

function inDecade(track: ItunesTrack, decade: Decade): boolean {
  if (decade === "any") return true;
  const year = trackYear(track);
  if (year === null) return false;
  const [start, end] = DECADE_YEAR_RANGES[decade];
  return year >= start && year <= end;
}

function normalizeKey(track: ItunesTrack): string {
  return `${track.trackName.toLowerCase().trim()}::${track.artistName
    .toLowerCase()
    .trim()}`;
}

function higherResArtwork(url: string | undefined): string | null {
  if (!url) return null;
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, "/600x600bb.$1");
}

function toSongPoolTrack(
  entry: RankedTrack,
  difficulty: SongPoolTrack["difficulty"]
): SongPoolTrack {
  return {
    id: String(entry.track.trackId),
    name: entry.track.trackName,
    artist: entry.track.artistName,
    albumArtUrl: higherResArtwork(entry.track.artworkUrl100),
    previewUrl: entry.track.previewUrl as string,
    popularity: entry.rank,
    difficulty,
  };
}

async function fetchArtistCatalog(): Promise<RankedTrack[]> {
  const byId = new Map<number, RankedTrack>();
  const seenKeys = new Set<string>();

  for (let start = 0; start < OPM_ARTISTS.length; start += FETCH_CHUNK_SIZE) {
    const chunk = OPM_ARTISTS.slice(start, start + FETCH_CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map((artist) =>
        itunesSearch({
          term: artist,
          country: "PH",
          media: "music",
          entity: "song",
          attribute: "artistTerm",
          limit: "25",
        }).catch(() => null)
      )
    );

    chunkResults.forEach((result, i) => {
      if (!result) return;

      const queryArtist = chunk[i];
      const artistIndex = start + i;
      const artistBaseRank = (OPM_ARTISTS.length - artistIndex) * 1000;

      result.results.forEach((track, trackIndex) => {
        if (!track.previewUrl) return;
        if (!isArtistMatch(track.artistName, queryArtist)) return;
        if (byId.has(track.trackId)) return;

        const key = normalizeKey(track);
        if (seenKeys.has(key)) return;

        byId.set(track.trackId, { track, rank: artistBaseRank - trackIndex });
        seenKeys.add(key);
      });
    });
  }

  return Array.from(byId.values());
}

async function getArtistCatalog(): Promise<RankedTrack[]> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) {
    return catalogCache.entries;
  }

  const entries = await fetchArtistCatalog();
  catalogCache = { entries, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS };
  return entries;
}

export async function fetchItunesSongPool(decade: Decade): Promise<SongPoolTrack[]> {
  const catalog = await getArtistCatalog();
  const inRange = catalog.filter((entry) => inDecade(entry.track, decade));

  const difficultyByTrack = assignDifficultyTiers(inRange);

  return inRange.map((entry) =>
    toSongPoolTrack(entry, difficultyByTrack.get(entry) ?? "impossible")
  );
}
