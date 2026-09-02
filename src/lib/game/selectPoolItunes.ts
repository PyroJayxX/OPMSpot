import { itunesSearch } from "../itunes/client";
import { ItunesTrack } from "../itunes/types";
import { assignDifficultyTiers } from "./difficulty";
import { Decade, SongPoolTrack } from "./types";


const OPM_ARTISTS = [
  // Alternative / Indie Pop / Modern Rock
"Ben&Ben", "Lola Amour", "Dilaw", "Cup of Joe", "SunKissed Lola", "IV of Spades", "Unique Salonga", "December Avenue", "The Juans", "Silent Sanctuary", "I Belong to the Zoo", "Munimuni", "Autotelic", "Sud", "Nobita", "fitterkarma",

// P-Pop / Modern Pop
"BINI", "SB19", "Sarah Geronimo", "Maki", "Zack Tabudlo", "Adie", "Arthur Nery", "Dionela", "TJ Monterde", "Moira Dela Torre", "Yeng Constantino", "Janine Berdin",

// Hip-Hop / Rap / Trap / Kalye
"Hev Abi", "Flow G", "Skusta Clee", "Al James", "O Side Mafia", "Yuridope", "Hellmerry", "Omar Baliw", "Ex Battalion", "Because", "Pricetagg", "Bugoy na Koykoy", "Nateman", "Lo ki", "Gat Putch", "Gloc-9", "Shanti Dope", "Abra", "Loonie", "Smugglaz", "Shehyee",

// Classic OPM Rock / Nineties Band Legends
"Eraserheads", "Rivermaya", "Parokya ni Edgar", "Kamikazee", "Bamboo", "Rico Blanco", "Ebe Dancel", "Sponge Cola", "Callalily", "Hale", "Up Dharma Down", "Itchyworms", "Mayonnaise", "Cueshe", "Sugarfree", "Chicosci", "Urbandub", "Orange & Lemons", "6cyclemind", "Moonstar88", "Imago",

// Total Legends / Ballad / Solo Icons
"Regine Velasquez", "Gary Valenciano", "Martin Nievera", "Ogie Alcasid", "Christian Bautista", "Erik Santos", "Rey Valera", "Side A", "South Border", "Jaya", "Kyla", "Aegis", "Kitchie Nadal",

// Folk & Hip-Hop Pioneers
"Freddie Aguilar", "APO Hiking Society", "Francis Magalona", "Andrew E."

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
      const artistTiebreak = OPM_ARTISTS.length - artistIndex;

      result.results.forEach((track, trackIndex) => {
        if (!track.previewUrl) return;
        if (!isArtistMatch(track.artistName, queryArtist)) return;
        if (byId.has(track.trackId)) return;

        const key = normalizeKey(track);
        if (seenKeys.has(key)) return;

        // trackIndex dominates (an artist's 2nd-most-recognizable song is
        // always harder than their 1st, regardless of whose catalog it's
        // from); artistTiebreak only separates songs sharing the same
        // trackIndex across different artists.
        const rank = -trackIndex * 1000 + artistTiebreak;
        byId.set(track.trackId, { track, rank });
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
