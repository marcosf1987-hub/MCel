"use client";

import { useState } from "react";
import { TierBadge } from "@/components/ui/badge";
import { StarRating } from "@/components/product/star-rating";
import { Button } from "@/components/ui/button";
import {
  GLUTEN_LABELS,
  type GlutenCertification,
  type UserTier,
} from "@/types/database";

const PREVIEW_LEN = 200;

export interface ReviewCardData {
  id: string;
  rating: number;
  opinion: string;
  general_description: string;
  taste: string | null;
  price: number;
  gluten_certification: GlutenCertification;
  created_at: string;
  display_name: string | null;
  tier: UserTier;
}

export function ReviewCard({ review }: { review: ReviewCardData }) {
  const [expanded, setExpanded] = useState(false);
  const fullText = `${review.general_description}\n\n${review.opinion}`;
  const needsExpand = fullText.length > PREVIEW_LEN;
  const displayText =
    expanded || !needsExpand ? fullText : fullText.slice(0, PREVIEW_LEN) + "…";

  return (
    <article className="rounded-lg border border-[var(--color-border)] bg-white p-4">
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
      <p className="mt-2 whitespace-pre-wrap text-sm">{displayText}</p>
      {needsExpand && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-auto p-0 text-[var(--color-primary)]"
          onClick={() => setExpanded(!expanded)}
          type="button"
        >
          {expanded ? "Ver menos" : "Ver más"}
        </Button>
      )}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--color-muted-foreground)]">
        {review.taste && <span>Sabor: {review.taste}</span>}
        <span>Precio: ${Number(review.price).toLocaleString("es-AR")}</span>
        <span>{GLUTEN_LABELS[review.gluten_certification]}</span>
      </div>
    </article>
  );
}
