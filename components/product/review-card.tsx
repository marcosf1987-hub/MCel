"use client";

import { useState } from "react";
import { TierBadge } from "@/components/ui/badge";
import { StarRating } from "@/components/product/star-rating";
import { HeartRating } from "@/components/product/heart-rating";
import { ReportButton } from "@/components/product/report-button";
import { Button } from "@/components/ui/button";
import {
  GLUTEN_LABELS,
  PRICE_RANGE_LABELS,
  TASTE_RATING_LABELS,
  type GlutenCertification,
  type PriceRange,
  type TasteRating,
  type UserTier,
} from "@/types/database";

const PREVIEW_LEN = 200;

export interface ReviewCardData {
  id: string;
  rating: number;
  opinion: string;
  general_description: string | null;
  taste: string | null;
  taste_rating: TasteRating | null;
  price_range: PriceRange | null;
  gluten_certification: GlutenCertification;
  created_at: string;
  display_name: string | null;
  tier: UserTier;
}

export function ReviewCard({
  review,
  showReport = true,
}: {
  review: ReviewCardData;
  showReport?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayText = review.opinion;
  const needsExpand = displayText.length > PREVIEW_LEN;
  const preview =
    expanded || !needsExpand ? displayText : displayText.slice(0, PREVIEW_LEN) + "…";

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{review.display_name ?? "Usuario"}</span>
          <TierBadge tier={review.tier} />
        </div>
        <time className="text-xs text-[var(--color-muted-foreground)]">
          {new Date(review.created_at).toLocaleDateString("es-AR")}
        </time>
      </div>
      <StarRating value={review.rating} size="sm" />
      <p className="mt-2 whitespace-pre-wrap text-sm">{preview}</p>
      {needsExpand && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-auto p-0 font-medium text-[var(--color-accent)]"
          onClick={() => setExpanded(!expanded)}
          type="button"
        >
          {expanded ? "Ver menos" : "Ver más"}
        </Button>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
        {review.taste_rating && (
          <span className="flex items-center gap-1">
            Sabor:
            <HeartRating value={review.taste_rating} size="sm" />
            {TASTE_RATING_LABELS[review.taste_rating]}
          </span>
        )}
        {!review.taste_rating && review.taste && <span>Sabor: {review.taste}</span>}
        {review.price_range && (
          <span>Rango de precio: {PRICE_RANGE_LABELS[review.price_range]}</span>
        )}
        <span>{GLUTEN_LABELS[review.gluten_certification]}</span>
      </div>
      {showReport && (
        <div className="mt-3 border-t border-[var(--color-border)] pt-2">
          <ReportButton targetType="review" targetId={review.id} />
        </div>
      )}
    </article>
  );
}
