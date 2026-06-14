import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ListMusic, Star } from "lucide-react";
import type { HomePageData, HomeTopRatedProduct } from "@/lib/home-server";

function productBadge(rating: number | null): { label: string; className: string } {
  const r = rating ?? 0;
  if (r >= 4.5) return { label: "Imprescindible", className: "text-[var(--color-secondary)]" };
  if (r >= 4) return { label: "Destacado", className: "text-[var(--color-primary)]" };
  return { label: "Popular", className: "text-[var(--color-muted-foreground)]" };
}

function recommendPct(rating: number | null): number {
  if (rating == null) return 0;
  return Math.min(100, Math.round((rating / 5) * 100));
}

export function HomeRankedProductRows({
  products,
  title,
}: {
  products: HomeTopRatedProduct[];
  title: string;
}) {
  if (!products.length) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 font-[family-name:var(--font-headline)] text-xl font-bold text-[var(--color-brown)]">
        {title}
      </h2>
      <ul className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-white">
        {products.map((product) => {
          const badge = productBadge(product.weighted_rating);
          return (
            <li key={product.id}>
              <Link
                href={`/productos/${product.slug}`}
                className="flex items-center gap-3 p-3 active:bg-[var(--color-brand-cream)]"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--color-brand-cream)]">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-contain p-1.5"
                      sizes="56px"
                      unoptimized={product.image_url.includes("openfoodfacts")}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-[var(--color-muted-foreground)]">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="truncate font-semibold text-[var(--color-brown)]">
                      {product.name}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  {product.brand_name && (
                    <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                      {product.brand_name}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs">
                    <span className="font-semibold text-[var(--color-primary)]">
                      {recommendPct(product.weighted_rating)}% recomendado
                    </span>
                    <span className="text-[var(--color-muted-foreground)]">
                      {" "}
                      · {product.review_count}{" "}
                      {product.review_count === 1 ? "evaluación" : "evaluaciones"}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="flex items-center gap-0.5 text-sm font-bold text-[var(--color-brown)]">
                    <Star className="h-3.5 w-3.5 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                    {product.weighted_rating?.toFixed(1) ?? "—"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function HomeRankedListRows({
  lists,
  title,
}: {
  lists: HomePageData["topLists"];
  title: string;
}) {
  if (!lists.length) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 font-[family-name:var(--font-headline)] text-xl font-bold text-[var(--color-brown)]">
        {title}
      </h2>
      <ul className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-white">
        {lists.map((list) => (
          <li key={list.id}>
            <Link
              href={
                list.username ? `/listas/${list.username}/${list.slug}` : "/explorar/listas"
              }
              className="flex items-center gap-3 p-3 active:bg-[var(--color-brand-cream)]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-cream)] text-[var(--color-primary)]">
                <ListMusic className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="truncate font-semibold text-[var(--color-brown)]">
                    {list.title}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-[var(--color-secondary)]">
                    Destacada
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {list.display_name ?? list.username ?? "Comunidad"}
                </p>
                {list.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-neutral)]">
                    {list.description}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                  {list.vote_count} {list.vote_count === 1 ? "voto" : "votos"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
