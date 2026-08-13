import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicPlaces } from "@/lib/places-server";
import { PlacesMapClient } from "@/components/places/places-map-client";
import {
  PLACE_CELIAC_LABELS,
  PLACE_TYPE_LABELS,
} from "@/types/database";
import { MapPin, Store } from "lucide-react";

export const metadata = {
  title: "Locales",
  description:
    "Mapa de comercios y restaurantes con opciones sin TACC en CeliApp.",
};

export default async function LocalesPage() {
  const supabase = await createClient();
  const places = await fetchPublicPlaces(supabase);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-6 flex items-start gap-3">
        <Store className="mt-0.5 h-7 w-7 shrink-0 text-[var(--color-accent)]" />
        <div>
          <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
            Locales
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Comercios y restaurantes con opciones para celíacos. Tocá un marcador
            o un nombre para ver la ficha.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PlacesMapClient places={places} />

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Lista ({places.length})
          </h2>
          {places.length === 0 ? (
            <p className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              Todavía no hay locales publicados. Pronto vas a ver puntos en el
              mapa.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
              {places.map((place) => (
                <li key={place.id}>
                  <Link
                    href={`/locales/${place.slug}`}
                    className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--color-brand-cream)]"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--color-brown)]">
                        {place.name}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {PLACE_TYPE_LABELS[place.place_type]} ·{" "}
                        {PLACE_CELIAC_LABELS[place.celiac_level]}
                      </p>
                      {(place.address || place.city) && (
                        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)] line-clamp-1">
                          {[place.address, place.city]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
