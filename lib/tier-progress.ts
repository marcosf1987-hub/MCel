import {
  tierFromCollaborations,
  TIER_LABELS,
  type UserTier,
} from "@/types/database";

const TIER_THRESHOLDS: Record<UserTier, number | null> = {
  none: 10,
  bronze: 50,
  silver: 100,
  gold: null,
};

export interface TierProgress {
  currentTier: UserTier;
  currentLabel: string;
  count: number;
  nextTier: UserTier | null;
  nextLabel: string | null;
  nextThreshold: number | null;
  remaining: number | null;
  isMaxTier: boolean;
  progressPercent: number;
}

export function getTierProgress(collaborationCount: number): TierProgress {
  const currentTier = tierFromCollaborations(collaborationCount);
  const nextThreshold = TIER_THRESHOLDS[currentTier];

  if (nextThreshold === null) {
    return {
      currentTier,
      currentLabel: TIER_LABELS[currentTier],
      count: collaborationCount,
      nextTier: null,
      nextLabel: null,
      nextThreshold: null,
      remaining: null,
      isMaxTier: true,
      progressPercent: 100,
    };
  }

  const prevThreshold =
    currentTier === "none"
      ? 0
      : currentTier === "bronze"
        ? 10
        : currentTier === "silver"
          ? 50
          : 100;

  const nextTier: UserTier =
    currentTier === "none"
      ? "bronze"
      : currentTier === "bronze"
        ? "silver"
        : "gold";

  const span = nextThreshold - prevThreshold;
  const progress = Math.min(
    100,
    Math.round(((collaborationCount - prevThreshold) / span) * 100)
  );

  return {
    currentTier,
    currentLabel: TIER_LABELS[currentTier],
    count: collaborationCount,
    nextTier,
    nextLabel: TIER_LABELS[nextTier],
    nextThreshold,
    remaining: Math.max(0, nextThreshold - collaborationCount),
    isMaxTier: false,
    progressPercent: progress,
  };
}
