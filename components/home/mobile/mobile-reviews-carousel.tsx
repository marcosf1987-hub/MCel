"use client";

import Link from "next/link";
import { HomeCarousel, HomeCarouselSlide } from "@/components/home/mobile/home-carousel";
import { HomeSectionHeader } from "@/components/home/mobile/home-section-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { StarRating } from "@/components/product/star-rating";
import { TierBadge } from "@/components/ui/badge";
import type { HomeLatestReview } from "@/lib/home-server";
import { cn } from "@/lib/utils";

function excerpt(text: string, max = 100): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function MobileReviewsCarousel({
  reviews,
  className,
}: {
  reviews: HomeLatestReview[];
  className?: string;
}) {
  if (!reviews.length) return null;

  return (
    <section className={cn("mb-5", className)}>
      <HomeSectionHeader title="Últimas evaluaciones" href="/productos" linkLabel="Ver todo" />
      <HomeCarousel>
        {reviews.map((review) => (
          <HomeCarouselSlide key={review.id}>
            <article className="flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <UserAvatar
                  userId={review.user_id}
                  displayName={review.display_name}
                  username={review.username}
                  avatarUrl={review.avatar_url}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-brown)]">
                    {review.display_name ?? review.username ?? "Usuario"}
                  </p>
                  <TierBadge tier={review.tier} className="text-[9px]" />
                </div>
              </div>
              <StarRating value={review.rating} size="sm" showValue={false} />
              <p className="mt-2 flex-1 text-sm italic leading-snug text-[var(--color-brown)] line-clamp-3">
                &ldquo;{excerpt(review.opinion)}&rdquo;
              </p>
              <Link
                href={`/productos/${review.product_slug}`}
                className="mt-3 truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
              >
                {review.brand_name ? `${review.brand_name} · ` : ""}
                {review.product_name}
              </Link>
            </article>
          </HomeCarouselSlide>
        ))}
      </HomeCarousel>
    </section>
  );
}
