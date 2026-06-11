import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { tierContributorLabel } from "@/lib/avatar";
import type { HomeTopRatedProduct } from "@/lib/home-server";

function excerpt(text: string | null, max = 120): string {
  if (!text?.trim()) return "";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function TopRatedSection({ products }: { products: HomeTopRatedProduct[] }) {
  if (!products.length) {
    return (
      <section className="mb-14">
        <h2 className="mb-4 font-[family-name:var(--font-headline)] text-2xl font-bold italic text-[var(--color-brown)]">
          Mejor puntuados
        </h2>
        <p className="text-[var(--color-muted-foreground)]">
          Aún no hay productos evaluados. ¡Sé el primero en cargar uno!
        </p>
      </section>
    );
  }

  return (
    <section className="mb-14">
      <div className="mb-2">
        <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold italic text-[var(--color-brown)]">
          Mejor puntuados
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Descubrí lo que la comunidad valora. Las puntuaciones ponderan la reputación de
          cada colaborador.
        </p>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="flex flex-col">
            <Link
              href={`/productos/${product.slug}`}
              className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--color-brand-cream)]"
            >
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  unoptimized={product.image_url.includes("openfoodfacts")}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
                  Sin foto
                </div>
              )}
            </Link>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-brown)]">
                <Link href={`/productos/${product.slug}`} className="hover:underline">
                  {product.name}
                </Link>
              </h3>
              <div className="shrink-0 text-right">
                <p className="flex items-center justify-end gap-1 text-lg font-bold text-[var(--color-brown)]">
                  <Star className="h-4 w-4 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                  {product.weighted_rating?.toFixed(1) ?? "—"}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  Puntuación ponderada
                </p>
              </div>
            </div>
            {product.featured_opinion && (
              <p className="mt-3 text-sm italic leading-relaxed text-[var(--color-neutral)]">
                &ldquo;{excerpt(product.featured_opinion)}&rdquo;
                {product.featured_display_name && (
                  <span className="not-italic text-[var(--color-muted-foreground)]">
                    {" "}
                    — {product.featured_tier ? tierContributorLabel(product.featured_tier) : "Colaborador"}{" "}
                    {product.featured_display_name}
                  </span>
                )}
              </p>
            )}
            <Link
              href={`/productos/${product.slug}/resenas`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border-2 border-[var(--color-brown)] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--color-brown)] transition-colors hover:bg-[var(--color-brown)] hover:text-white"
            >
              Ver {product.review_count}{" "}
              {product.review_count === 1 ? "evaluación" : "evaluaciones"}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
