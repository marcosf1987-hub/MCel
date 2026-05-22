import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();

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
      brand_name: (p.brands as { name: string } | null)?.name,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-12 rounded-2xl bg-[var(--color-secondary)] px-6 py-10 text-center">
        <h1 className="text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
          Productos sin gluten evaluados por celíacos
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--color-muted-foreground)]">
          Escaneá, evaluá y compartí tu experiencia. Las valoraciones de la comunidad
          tienen más peso cuanto más colaborás.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/productos">Explorar productos</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/productos/nuevo">Cargar producto</Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Mejor puntuados</h2>
        {cards.length === 0 ? (
          <p className="text-[var(--color-muted-foreground)]">
            Aún no hay productos. ¡Sé el primero en cargar uno!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold text-[var(--color-primary)]">Escaneá</h3>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Usá el código de barras para obtener datos de Open Food Facts automáticamente.
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold text-[var(--color-primary)]">Evaluá</h3>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Puntuá del 1 al 5 y contá tu experiencia: sabor, precio y certificación.
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold text-[var(--color-primary)]">Colaborá</h3>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Más de 10, 50 o 100 aportes te dan badge Bronce, Plata u Oro con mayor peso.
          </p>
        </div>
      </section>
    </div>
  );
}
