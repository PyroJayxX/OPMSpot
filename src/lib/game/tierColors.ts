import { DifficultyTier } from "./types";

export interface TierColor {
  accent: string;
  accentStrong: string;
  accentForeground: string;
}

export const TIER_COLORS: Record<DifficultyTier, TierColor> = {
  easy: { accent: "#4ade80", accentStrong: "#34c165", accentForeground: "#052e12" },
  medium: { accent: "#f5b942", accentStrong: "#e8a020", accentForeground: "#1a1305" },
  hard: { accent: "#fb923c", accentStrong: "#ea7c1c", accentForeground: "#23130a" },
  expert: { accent: "#f87171", accentStrong: "#ef5350", accentForeground: "#2b0a0a" },
  impossible: { accent: "#c084fc", accentStrong: "#a855f7", accentForeground: "#1c0b2e" },
};
