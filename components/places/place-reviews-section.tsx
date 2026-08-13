"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PlaceReview } from "@/types/database";
import { Loader2, Star } from "lucide-react";

export function PlaceReviewsSection({
  placeId,
  placeSlug,
  initialReviews,
  userReview,
  isLoggedIn,
  reviewCount,
  weightedRating,
}: {
  placeId: string;
  placeSlug: string;
  initialReviews: PlaceReview[];
  userReview: PlaceReview | null;
  isLoggedIn: boolean;
  reviewCount: number;
  weightedRating: number | null;
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [opinion, setOpinion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMine, setHasMine] = useState(Boolean(userReview));

  const submit = async () => {
    if (!isLoggedIn) {
      router.push(`/login?returnUrl=/locales/${placeSlug}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/places/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ placeId, rating, opinion }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setHasMine(true);
      setOpinion("");
      router.refresh();
      setReviews((prev) => [
        {
          id: data.reviewId,
          place_id: placeId,
          user_id: "",
          rating,
          opinion,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10 space-y-4">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--color-brown)]">
          Evaluaciones del local
        </h2>
        {reviewCount > 0 && (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {weightedRating != null ? weightedRating.toFixed(1) : "—"} / 5 ·{" "}
            {reviewCount} reseña{reviewCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {!hasMine && (
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 space-y-3">
          {!isLoggedIn ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              <Link
                href={`/login?returnUrl=/locales/${placeSlug}`}
                className="font-medium text-[var(--color-primary)] hover:underline"
              >
                Iniciá sesión
              </Link>{" "}
              para evaluar este local.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Puntuación</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className="p-1"
                      aria-label={`${n} estrellas`}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          n <= rating
                            ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                            : "text-[var(--color-border)]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="place-opinion">Tu opinión</Label>
                <Textarea
                  id="place-opinion"
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  rows={3}
                  placeholder="¿Cómo fue la experiencia celíaca?"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <Button type="button" onClick={submit} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publicar evaluación
              </Button>
            </>
          )}
        </div>
      )}

      {hasMine && userReview && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Ya evaluaste este local ({userReview.rating}/5).
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Todavía no hay evaluaciones.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-white">
          {reviews.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <p className="text-sm font-medium text-[var(--color-brown)]">
                {r.rating}/5
                {r.profile?.display_name
                  ? ` · ${r.profile.display_name}`
                  : ""}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {r.opinion}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
