const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/\((feat\.?|ft\.?|featuring)[^)]*\)/g, "")
    .replace(/\((remaster(ed)?|live|radio edit|single version)[^)]*\)/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinRatio(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  const distance = dp[a.length][b.length];
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
}

export function matchGuess(guess: string, trackName: string): boolean {
  const normalizedGuess = normalize(guess);
  const normalizedTarget = normalize(trackName);

  if (normalizedGuess.length === 0) return false;
  if (normalizedGuess === normalizedTarget) return true;
  if (
    normalizedGuess.length >= 3 &&
    normalizedTarget.includes(normalizedGuess)
  ) {
    return true;
  }

  return levenshteinRatio(normalizedGuess, normalizedTarget) >= 0.8;
}
