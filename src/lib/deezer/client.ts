export class DeezerRateLimitError extends Error {
  constructor() {
    super("Deezer rate limit hit");
  }
}

interface DeezerErrorPayload {
  error?: { type: string; message: string; code: number };
}

export async function deezerFetch<T extends DeezerErrorPayload>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`https://api.deezer.com${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Deezer API error (${res.status}) for ${path}`);
  }

  const data = (await res.json()) as T;

  if (data.error) {
    if (data.error.code === 4) throw new DeezerRateLimitError();
    throw new Error(`Deezer API error: ${data.error.message}`);
  }

  return data;
}
