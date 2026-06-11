import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { StarRating } from "@/components/product/star-rating";
import { TierBadge } from "@/components/ui/badge";
import type { HomeLatestReview } from "@/lib/home-server";

function excerpt(text: string, max = 140): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function LatestReviewsSection({ reviews }: { reviews: HomeLatestReview[] }) {
  if (!reviews.length) return null;

  return (
    <section className="mb-10 md:mb-14">
      <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
        <h2 className="font-[family-name:var(--font-headline)] text-xl font-bold italic text-[var(--color-brown)] md:text-2xl">
          Últimas evaluaciones
        </h2>
        <Link
          href="/productos"
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral)] hover:text-[var(--color-primary)]"
        >
          Ver comunidad
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm md:p-6"
          >
            <div className="mb-3 flex items-center gap-3">
              <UserAvatar
                userId={review.user_id}
                displayName={review.display_name}
                username={review.username}
                avatarUrl={review.avatar_url}
                size="md"
              />
              <div>
                <p className="font-semibold text-[var(--color-brown)]">
                  {review.display_name ?? review.username ?? "Usuario"}
                </p>
                <TierBadge tier={review.tier} className="mt-0.5 text-[10px]" />
              </div>
            </div>
            <StarRating value={review.rating} size="sm" />
            <p className="mt-3 flex-1 font-[family-name:var(--font-headline)] text-base italic leading-snug text-[var(--color-brown)]">
              &ldquo;{excerpt(review.opinion)}&rdquo;
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs">
              <Link
                href={`/productos/${review.product_slug}`}
                className="font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
              >
                {review.brand_name ? `${review.brand_name} · ` : ""}
                {review.product_name}
              </Link>
              <span className="flex items-center gap-1 text-[var(--color-muted-foreground)]">
                <MessageCircle className="h-3.5 w-3.5" />
                {review.product_review_count}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
