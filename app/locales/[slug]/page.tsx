import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  fetchPlaceBySlug,
  fetchPlaceItems,
  fetchPlaceReviews,
  fetchUserPlaceItemReviewsMap,
  fetchUserPlaceReview,
} from "@/lib/places-server";
import { PlacesMapClient } from "@/components/places/places-map-client";
import { PlaceReviewsSection } from "@/components/places/place-reviews-section";
import { PlaceItemsSection } from "@/components/places/place-items-section";
import { ReportButton } from "@/components/product/report-button";
import {
  PLACE_CELIAC_LABELS,
  PLACE_TYPE_LABELS,
} from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin, Phone, Star } from "lucide-react";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const place = await fetchPlaceBySlug(supabase, slug);
  if (!place) return { title: "Local no encontrado" };
  return {
    title: place.name,
    description:
      place.description?.slice(0, 160) ??
      `${PLACE_TYPE_LABELS[place.place_type]} · ${PLACE_CELIAC_LABELS[place.celiac_level]}`,
  };
}

export default async function LocalDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const place = await fetchPlaceBySlug(supabase, slug);
  if (!place) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [reviews, items, userReview, userItemReviews] = await Promise.all([
    fetchPlaceReviews(supabase, place.id),
    fetchPlaceItems(supabase, place.id),
    user
      ? fetchUserPlaceReview(supabase, place.id, user.id)
      : Promise.resolve(null),
    user
      ? fetchUserPlaceItemReviewsMap(supabase, place.id, user.id)
      : Promise.resolve({}),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <Link
        href="/locales"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← Volver al mapa
      </Link>

      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {PLACE_TYPE_LABELS[place.place_type]}
          </Badge>
          <Badge>{PLACE_CELIAC_LABELS[place.celiac_level]}</Badge>
          {place.review_count > 0 && place.weighted_rating != null && (
            <span className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
              <Star className="h-3.5 w-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
              {place.weighted_rating.toFixed(1)} ({place.review_count})
            </span>
          )}
        </div>
        <h1 className="font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-brown)]">
          {place.name}
        </h1>
        {(place.address || place.city) && (
          <p className="flex items-start gap-2 text-sm text-[var(--color-muted-foreground)]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            {[place.address, place.city].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      {place.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={place.cover_image_url}
          alt={place.name}
          className="mt-6 h-48 w-full rounded-xl object-cover"
        />
      )}

      {place.description && (
        <p className="mt-6 text-sm leading-relaxed text-[var(--color-brown)]">
          {place.description}
        </p>
      )}

      {place.celiac_notes && (
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-brand-cream)] px-4 py-3 text-sm">
          <p className="font-medium text-[var(--color-brown)]">Notas celíaco</p>
          <p className="mt-1 text-[var(--color-muted-foreground)]">
            {place.celiac_notes}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        {place.phone && (
          <a
            href={`tel:${place.phone}`}
            className="inline-flex items-center gap-1.5 font-medium text-[var(--color-primary)] hover:underline"
          >
            <Phone className="h-4 w-4" />
            {place.phone}
          </a>
        )}
        {place.website && (
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-[var(--color-primary)] hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Sitio web
          </a>
        )}
        {user && (
          <ReportButton targetType="place" targetId={place.id} />
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Ubicación
        </h2>
        <PlacesMapClient places={[place]} />
      </div>

      <PlaceReviewsSection
        placeId={place.id}
        placeSlug={place.slug}
        initialReviews={reviews}
        userReview={userReview}
        isLoggedIn={Boolean(user)}
        currentUserId={user?.id ?? null}
        reviewCount={place.review_count}
        weightedRating={place.weighted_rating}
      />

      <PlaceItemsSection
        placeId={place.id}
        placeSlug={place.slug}
        initialItems={items}
        isLoggedIn={Boolean(user)}
        initialUserReviews={userItemReviews}
      />
    </div>
  );
}
