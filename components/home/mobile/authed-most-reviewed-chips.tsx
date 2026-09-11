import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { HomeTopRatedProduct } from "@/lib/home-server";

/** Carrusel compacto horizontal para “Más evaluados” (chips con foto + conteo). */
export function AuthedMostReviewedChips({ products }: { products: HomeTopRatedProduct[] }) {
  if (!products.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 px-4">
        <h2 className="font-[family-name:var(--font-headline)] text-xl font-semibold text-[var(--color-brown)]">
          Más evaluados
        </h2>
        <p className="text-[13px] text-[var(--color-muted-foreground)]">
          Los productos con mayor feedback de la comunidad
        </p>
      </div>
      <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/productos/${product.slug}`}
            className="flex min-w-[210px] shrink-0 items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-sm"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--color-brand-cream)]">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                  unoptimized={product.image_url.includes("openfoodfacts")}
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-bold text-[var(--color-brown)]">
                {product.name}
              </h3>
              <p className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-primary)]">
                <Star className="h-3 w-3 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                {product.review_count}{" "}
                {product.review_count === 1 ? "evaluación" : "evaluaciones"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
