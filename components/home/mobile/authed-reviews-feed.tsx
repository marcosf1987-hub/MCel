import Link from "next/link";
import { Star } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { HomeLatestReview } from "@/lib/home-server";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "Hace un momento" : `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "Hace 1 hora" : `Hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-AR");
}

function excerpt(text: string, max = 140): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function AuthedReviewsFeed({ reviews }: { reviews: HomeLatestReview[] }) {
  if (!reviews.length) return null;

  return (
    <section className="mb-8 px-4">
      <div className="mb-3">
        <h2 className="font-[family-name:var(--font-headline)] text-xl font-semibold text-[var(--color-brown)]">
          Últimas evaluaciones
        </h2>
        <p className="text-[13px] text-[var(--color-muted-foreground)]">
          Reseñas recientes de colaboradores
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
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
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {relativeTime(review.created_at)}
                  </p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-0.5 text-sm font-bold text-[var(--color-brown)]">
                <Star className="h-3.5 w-3.5 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                {review.rating}
              </span>
            </div>
            <p className="text-[15px] leading-relaxed text-[var(--color-brown)]">
              &ldquo;{excerpt(review.opinion)}&rdquo;
            </p>
            <Link
              href={`/productos/${review.product_slug}`}
              className="mt-2 inline-flex text-[11px] font-bold text-[var(--color-primary)]"
            >
              {review.brand_name ? `${review.brand_name} · ` : ""}
              {review.product_name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
