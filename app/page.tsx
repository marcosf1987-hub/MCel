import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCardGrid } from "@/components/product/product-card-grid";
import { getProductCardAuthContext } from "@/lib/product-card-auth";
import { getBrandName } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const { isLoggedIn, favoriteIds } = await getProductCardAuthContext(supabase);

  const { data: products } = await supabase
    .from("products")
    .select(
      `
      id, slug, name, weighted_rating, review_count,
      brands(name),
      product_images(url, sort_order)
    `
    )
    .order("weighted_rating", { ascending: false, nullsFirst: false })
    .limit(8);

  const cards = (products ?? []).map((p) => {
    const images = (p.product_images as { url: string; sort_order: number }[]) ?? [];
    images.sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      weighted_rating: p.weighted_rating,
      review_count: p.review_count,
      image_url: images[0]?.url ?? null,
      brand_name: getBrandName(p.brands),
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-12 overflow-hidden rounded-3xl border border-[var(--color-brand-light)] bg-gradient-to-br from-[var(--color-brand-cream)] via-white to-[var(--color-secondary)] px-6 py-12 text-center shadow-sm">
        <p className="mb-3 inline-block rounded-full bg-[var(--color-accent)] px-4 py-1 text-xs font-semibold text-[var(--color-brown)]">
          Comunidad celíaca Argentina
        </p>
        <h1 className="text-3xl font-bold text-[var(--color-brown)] sm:text-4xl">
          Productos sin gluten evaluados por celíacos
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--color-neutral)]">
          Escaneá, evaluá y compartí tu experiencia. Las valoraciones de la comunidad
          tienen más peso cuanto más colaborás.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/productos">Explorar productos</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/productos/nuevo">Cargar producto</Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-headline)] text-xl font-bold text-[var(--color-brown)]">
          Mejor puntuados
        </h2>
        {cards.length === 0 ? (
          <p className="text-[var(--color-muted-foreground)]">
            Aún no hay productos. ¡Sé el primero en cargar uno!
          </p>
        ) : (
          <ProductCardGrid
            products={cards}
            isLoggedIn={isLoggedIn}
            favoriteIds={favoriteIds}
          />
        )}
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-lg">
            📷
          </span>
          <h3 className="mt-3 font-[family-name:var(--font-headline)] font-semibold text-[var(--color-brown)]">
            Escaneá
          </h3>
          <p className="mt-2 text-sm text-[var(--color-neutral)]">
            Usá el código de barras para obtener datos de Open Food Facts automáticamente.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-lg">
            ⭐
          </span>
          <h3 className="mt-3 font-[family-name:var(--font-headline)] font-semibold text-[var(--color-brown)]">
            Evaluá
          </h3>
          <p className="mt-2 text-sm text-[var(--color-neutral)]">
            Puntuá del 1 al 5 y contá tu experiencia: sabor, precio y certificación.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-lg">
            🏅
          </span>
          <h3 className="mt-3 font-[family-name:var(--font-headline)] font-semibold text-[var(--color-brown)]">
            Colaborá
          </h3>
          <p className="mt-2 text-sm text-[var(--color-neutral)]">
            Más de 10, 50 o 100 aportes te dan badge Bronce, Plata u Oro con mayor peso.
          </p>
        </div>
      </section>
    </div>
  );
}
