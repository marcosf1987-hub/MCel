import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUserPlaceProposals } from "@/lib/places-server";
import { Button } from "@/components/ui/button";
import {
  PLACE_CELIAC_LABELS,
  PLACE_STATUS_LABELS,
  PLACE_TYPE_LABELS,
} from "@/types/database";
import { ArrowLeft, MapPin, PlusCircle } from "lucide-react";

export const metadata = { title: "Mis propuestas de locales" };

export default async function MisPropuestasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnUrl=/locales/mis-propuestas");
  }

  const places = await fetchUserPlaceProposals(supabase, user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8">
      <Link
        href="/locales"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al mapa
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
            Mis propuestas
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Estado de los locales que enviaste para revisión.
          </p>
        </div>
        <Button asChild variant="accent" size="sm">
          <Link href="/locales/nuevo" className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            Proponer
          </Link>
        </Button>
      </div>

      {places.length === 0 ? (
        <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-white px-4 py-10 text-center">
          <MapPin className="mx-auto h-8 w-8 text-[var(--color-accent)]" />
          <p className="mt-3 text-sm font-medium text-[var(--color-brown)]">
            Todavía no enviaste ninguna propuesta
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Sumá un comercio o restaurante para que lo revise un moderador.
          </p>
          <Button asChild variant="accent" size="sm" className="mt-4 gap-1.5">
            <Link href="/locales/nuevo">
              <PlusCircle className="h-4 w-4" />
              Proponer local
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
          {places.map((place) => (
            <li key={place.id} className="px-4 py-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {place.status === "published" ? (
                    <Link
                      href={`/locales/${place.slug}`}
                      className="font-medium text-[var(--color-brown)] hover:underline"
                    >
                      {place.name}
                    </Link>
                  ) : (
                    <p className="font-medium text-[var(--color-brown)]">
                      {place.name}
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {PLACE_TYPE_LABELS[place.place_type]} ·{" "}
                    {PLACE_CELIAC_LABELS[place.celiac_level]}
                  </p>
                  {(place.address || place.city) && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {[place.address, place.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {place.status === "rejected" && place.rejection_note && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm text-amber-900">
                      Motivo: {place.rejection_note}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    place.status === "published"
                      ? "bg-emerald-100 text-emerald-800"
                      : place.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {PLACE_STATUS_LABELS[place.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
