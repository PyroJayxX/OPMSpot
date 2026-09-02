import { ItunesSearchResponse } from "./types";

export async function itunesSearch(
  params: Record<string, string>
): Promise<ItunesSearchResponse> {
  const url = new URL("https://itunes.apple.com/search");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`iTunes API error (${res.status})`);
  }

  return (await res.json()) as ItunesSearchResponse;
}
