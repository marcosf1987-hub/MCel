"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { HomeTopPlace } from "@/lib/home-server";

export function AuthedTopPlacesCarousel({ places }: { places: HomeTopPlace[] }) {
  if (!places.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between gap-3 px-4">
        <div>
          <h2 className="font-[family-name:var(--font-headline)] text-xl font-semibold text-[var(--color-brown)] md:text-2xl">
            Locales más puntuados
          </h2>
          <p className="mt-0.5 text-[13px] text-[var(--color-muted-foreground)]">
            Con más evaluaciones de la comunidad
          </p>
        </div>
        <Link
          href="/locales"
          className="shrink-0 text-xs font-bold text-[var(--color-primary)]"
        >
          Ver mapa
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {places.map((place) => (
          <Link
            key={place.id}
            href={`/locales/${place.slug}`}
            className="w-[200px] shrink-0 rounded-2xl border border-[var(--color-border)] bg-white p-3.5 shadow-sm transition-transform active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f5e9] text-[#2f7a3e]">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug text-[var(--color-brown)]">
              {place.name}
            </h3>
            {(place.city || place.address) && (
              <p className="mt-1 line-clamp-1 text-[12px] text-[var(--color-muted-foreground)]">
                {place.city || place.address}
              </p>
            )}
            <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-brown)]">
              <Star className="h-3.5 w-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
              {place.weighted_rating != null
                ? place.weighted_rating.toFixed(1)
                : "—"}
              <span className="font-normal text-[var(--color-muted-foreground)]">
                · {place.review_count}{" "}
                {place.review_count === 1 ? "eval." : "evals."}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
