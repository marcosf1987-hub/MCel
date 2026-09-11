import Link from "next/link";
import { Heart, ListMusic, MapPin } from "lucide-react";
import type { HomeLatestPlace, HomePageData } from "@/lib/home-server";

export function AuthedListsSection({ lists }: { lists: HomePageData["topLists"] }) {
  if (!lists.length) return null;

  return (
    <section className="mb-8 px-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-headline)] text-xl font-semibold text-[var(--color-brown)]">
            Listas destacadas
          </h2>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Colecciones armadas por usuarios
          </p>
        </div>
        <Link
          href="/cuenta/listas/nueva"
          className="shrink-0 text-xs font-bold text-[var(--color-primary)]"
        >
          + Crear lista
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {lists.map((list) => (
          <li key={list.id}>
            <Link
              href={
                list.username ? `/listas/${list.username}/${list.slug}` : "/explorar/listas"
              }
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3.5 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F5F1EB] text-[var(--color-primary)]">
                  <ListMusic className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-bold text-[var(--color-brown)]">
                    {list.title}
                  </h3>
                  <p className="truncate text-[13px] text-[var(--color-muted-foreground)]">
                    por {list.display_name ?? list.username ?? "Comunidad"}
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fff0ed] px-2.5 py-1 text-[11px] font-bold text-[var(--color-brown)]">
                <Heart className="h-3.5 w-3.5 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                {list.vote_count} {list.vote_count === 1 ? "voto" : "votos"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function placeAgeLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "hoy";
  if (days === 1) return "hace 1 día";
  if (days < 7) return `hace ${days} días`;
  if (days < 14) return "hace 1 semana";
  return `hace ${Math.floor(days / 7)} semanas`;
}

export function AuthedLatestPlaces({ places }: { places: HomeLatestPlace[] }) {
  if (!places.length) return null;

  return (
    <section className="mb-8 px-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-headline)] text-xl font-semibold text-[var(--color-brown)]">
            Últimos locales
          </h2>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Los 3 más recientes agregados a la comunidad
          </p>
        </div>
        <Link href="/locales" className="shrink-0 text-xs font-bold text-[var(--color-primary)]">
          Ver mapa
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {places.map((place) => (
          <li key={place.id}>
            <Link
              href={`/locales/${place.slug}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3.5 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#e8f5e9] text-[#2f7a3e]">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-bold text-[var(--color-brown)]">
                  {place.name}
                </h3>
                <p className="truncate text-[13px] text-[var(--color-muted-foreground)]">
                  {place.city ? `${place.city} · ` : ""}
                  agregado {placeAgeLabel(place.created_at)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
