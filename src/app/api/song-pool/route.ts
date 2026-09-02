import { NextRequest, NextResponse } from "next/server";
import { DeezerRateLimitError } from "@/lib/deezer/client";
import { fetchSongPool } from "@/lib/game/selectPool";
import { fetchItunesSongPool } from "@/lib/game/selectPoolItunes";
import { Decade, Source } from "@/lib/game/types";

const VALID_DECADES: Decade[] = ["2000s", "2010s", "2020s", "any"];
const VALID_SOURCES: Source[] = ["deezer", "itunes"];

export async function GET(request: NextRequest) {
  const decadeParam = request.nextUrl.searchParams.get("decade") ?? "any";
  const sourceParam = request.nextUrl.searchParams.get("source") ?? "deezer";

  if (!VALID_DECADES.includes(decadeParam as Decade)) {
    return NextResponse.json(
      { error: `Invalid decade. Must be one of: ${VALID_DECADES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!VALID_SOURCES.includes(sourceParam as Source)) {
    return NextResponse.json(
      { error: `Invalid source. Must be one of: ${VALID_SOURCES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const tracks =
      sourceParam === "itunes"
        ? await fetchItunesSongPool(decadeParam as Decade)
        : await fetchSongPool(decadeParam as Decade);
    return NextResponse.json({ tracks });
  } catch (error) {
    if (error instanceof DeezerRateLimitError) {
      return NextResponse.json(
        { error: "Rate limited by Deezer, try again shortly." },
        { status: 429 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
