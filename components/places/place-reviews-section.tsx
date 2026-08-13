"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReportButton } from "@/components/product/report-button";
import type { PlaceReview } from "@/types/database";
import { Loader2, Star } from "lucide-react";

export function PlaceReviewsSection({
  placeId,
  placeSlug,
  initialReviews,
  userReview,
  isLoggedIn,
  currentUserId,
  reviewCount,
  weightedRating,
}: {
  placeId: string;
  placeSlug: string;
  initialReviews: PlaceReview[];
  userReview: PlaceReview | null;
  isLoggedIn: boolean;
  currentUserId: string | null;
  reviewCount: number;
  weightedRating: number | null;
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [mine, setMine] = useState(userReview);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(userReview?.rating ?? 5);
  const [opinion, setOpinion] = useState(userReview?.opinion ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    if (!mine) return;
    setRating(mine.rating);
    setOpinion(mine.opinion);
    setEditing(true);
    setError(null);
  };

  const submit = async () => {
    if (!isLoggedIn) {
      router.push(`/login?returnUrl=/locales/${placeSlug}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isUpdate = Boolean(mine);
      const res = await fetch(
        isUpdate ? `/api/places/reviews/${mine!.id}` : "/api/places/reviews",
        {
          method: isUpdate ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(
            isUpdate ? { rating, opinion } : { placeId, rating, opinion }
          ),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }

      const next: PlaceReview = {
        id: isUpdate ? mine!.id : data.reviewId,
        place_id: placeId,
        user_id: currentUserId ?? "",
        rating,
        opinion,
        deleted_at: null,
        created_at: mine?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: mine?.profile,
      };
      setMine(next);
      setEditing(false);
      setReviews((prev) => {
        const without = prev.filter((r) => r.id !== next.id);
        return [next, ...without];
      });
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const showForm = !mine || editing;

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

      {showForm && (
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
              <p className="text-sm font-medium text-[var(--color-brown)]">
                {mine ? "Editar tu evaluación" : "Tu evaluación"}
              </p>
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
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={submit} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mine ? "Guardar cambios" : "Publicar evaluación"}
                </Button>
                {editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditing(false);
                      setError(null);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {mine && !editing && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <span>Ya evaluaste este local ({mine.rating}/5).</span>
          <Button type="button" variant="ghost" size="sm" onClick={startEdit}>
            Editar
          </Button>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Todavía no hay evaluaciones.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-white">
          {reviews.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-brown)]">
                    {r.rating}/5
                    {r.profile?.display_name
                      ? ` · ${r.profile.display_name}`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    {r.opinion}
                  </p>
                </div>
                {isLoggedIn && r.user_id !== currentUserId && (
                  <ReportButton targetType="place_review" targetId={r.id} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
