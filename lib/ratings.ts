import { TIER_WEIGHTS, type UserTier } from "@/types/database";

export function getReviewWeight(tier: UserTier): number {
  return TIER_WEIGHTS[tier];
}

export function calculateWeightedRating(
  reviews: { rating: number; tier: UserTier }[]
): number | null {
  if (reviews.length === 0) return null;
  let sumWeighted = 0;
  let sumWeights = 0;
  for (const r of reviews) {
    const w = getReviewWeight(r.tier);
    sumWeighted += r.rating * w;
    sumWeights += w;
  }
  if (sumWeights === 0) return null;
  return Math.round((sumWeighted / sumWeights) * 100) / 100;
}
